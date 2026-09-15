import { db } from '../db';
import type { SyncQueueItem, Student, Meal, Deposit, ClassRoom } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from '../db/supabaseClient';

export function getActiveSchoolId(): string {
  return localStorage.getItem('cantine_school_id') || 'school-default-01';
}

export async function addToSyncQueue(
  tableName: SyncQueueItem['table_name'],
  action: SyncQueueItem['action'],
  recordId: string,
  payload: any
): Promise<void> {
  const enrichedPayload = { ...payload };
  if (enrichedPayload && typeof enrichedPayload === 'object' && !enrichedPayload.school_id && tableName !== 'settings') {
    enrichedPayload.school_id = getActiveSchoolId();
  }

  const item: SyncQueueItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    table_name: tableName,
    action: action,
    record_id: recordId,
    payload: enrichedPayload,
    created_at: new Date().toISOString(),
    status: 'pending'
  };

  await db.syncQueue.add(item);
  window.dispatchEvent(new Event('sync-queue-updated'));

  // If online and Supabase is configured, trigger background sync immediately
  if (navigator.onLine && isSupabaseConfigured()) {
    processSyncQueue().catch(console.error);
  }
}

export async function getPendingSyncCount(): Promise<number> {
  return await db.syncQueue.where('status').equals('pending').count();
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  message: string;
}

/**
 * Pushes pending mutations from IndexedDB syncQueue to remote Supabase database
 */
export async function processSyncQueue(): Promise<SyncResult> {
  const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();

  if (pendingItems.length === 0) {
    // If Supabase is connected, also pull any updates
    if (navigator.onLine && isSupabaseConfigured()) {
      await pullFromSupabase();
    }
    return {
      success: true,
      syncedCount: 0,
      message: 'Toutes les données locales sont à jour.'
    };
  }

  const client = getSupabaseClient();

  // If Supabase is NOT configured, simulate successful local processing
  if (!client) {
    for (const item of pendingItems) {
      await db.syncQueue.delete(item.id);
    }
    window.dispatchEvent(new Event('sync-queue-updated'));
    return {
      success: true,
      syncedCount: pendingItems.length,
      message: `${pendingItems.length} modification(s) enregistrée(s) localement.`
    };
  }

  let syncedCount = 0;
  const errors: string[] = [];

  for (const item of pendingItems) {
    try {
      await db.syncQueue.update(item.id, { status: 'processing' });

      // Table mapping for Supabase
      const tableName = item.table_name;

      if (item.action === 'create' || item.action === 'update') {
        const payload = { ...item.payload };
        delete payload.sync_status; // not needed remotely

        // Clean ID or foreign keys if necessary
        const { error } = await client.from(tableName).upsert(payload);
        if (error) throw error;
      } else if (item.action === 'delete') {
        const { error } = await client.from(tableName).delete().eq('id', item.record_id);
        if (error) throw error;
      }

      await db.syncQueue.delete(item.id);
      syncedCount++;
    } catch (err: any) {
      console.error(`Erreur sync élément ${item.id} sur table ${item.table_name}:`, err);
      await db.syncQueue.update(item.id, {
        status: 'pending',
        error_message: err?.message || 'Erreur réseau'
      });
      errors.push(err?.message || 'Erreur inconnue');
    }
  }

  // Pull latest updates from cloud after pushing
  try {
    await pullFromSupabase();
  } catch (pullErr) {
    console.warn('Erreur pull cloud :', pullErr);
  }

  window.dispatchEvent(new Event('sync-queue-updated'));

  if (errors.length > 0) {
    return {
      success: false,
      syncedCount,
      message: `${syncedCount} synchronisé(s), ${errors.length} erreur(s) : ${errors[0]}`
    };
  }

  return {
    success: true,
    syncedCount,
    message: `${syncedCount} modification(s) envoyée(s) au Cloud avec succès.`
  };
}

/**
 * Pulls updates from Supabase to IndexedDB for multi-device sync
 */
export async function pullFromSupabase(targetSchoolId?: string, forceAll = false): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) return;

  const schoolId = targetSchoolId || getActiveSchoolId();
  const lastSyncTime = forceAll ? '1970-01-01T00:00:00Z' : (localStorage.getItem(`cantine_last_synced_${schoolId}`) || '1970-01-01T00:00:00Z');

  try {
    // 1. Pull classes
    const { data: remoteClasses } = await client
      .from('classes')
      .select('*')
      .eq('school_id', schoolId)
      .gt('updated_at', lastSyncTime);
    if (remoteClasses && remoteClasses.length > 0) {
      await db.classes.bulkPut(remoteClasses as ClassRoom[]);
    }

    // 2. Pull students
    const { data: remoteStudents } = await client
      .from('students')
      .select('*')
      .eq('school_id', schoolId)
      .gt('updated_at', lastSyncTime);
    if (remoteStudents && remoteStudents.length > 0) {
      await db.students.bulkPut(remoteStudents as Student[]);
    }

    // 3. Pull meals
    const { data: remoteMeals } = await client
      .from('meals')
      .select('*')
      .eq('school_id', schoolId)
      .gt('updated_at', lastSyncTime);
    if (remoteMeals && remoteMeals.length > 0) {
      await db.meals.bulkPut(remoteMeals as Meal[]);
    }

    // 4. Pull deposits
    const { data: remoteDeposits } = await client
      .from('deposits')
      .select('*')
      .eq('school_id', schoolId)
      .gt('updated_at', lastSyncTime);
    if (remoteDeposits && remoteDeposits.length > 0) {
      await db.deposits.bulkPut(remoteDeposits as Deposit[]);
    }

    localStorage.setItem(`cantine_last_synced_${schoolId}`, new Date().toISOString());
  } catch (err) {
    console.error('Erreur lors du téléchargement des mises à jour Cloud :', err);
  }
}

let realtimeSubscription: any = null;

/**
 * Connects to Supabase Realtime channels to receive instant updates from other devices for the active school
 */
export function initRealtimeSync(): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  if (realtimeSubscription) {
    return () => {};
  }

  const schoolId = getActiveSchoolId();

  try {
    const channel = client.channel(`cantine-sync-${schoolId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `school_id=eq.${schoolId}` }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          await db.students.put(payload.new as Student);
          window.dispatchEvent(new Event('sync-queue-updated'));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals', filter: `school_id=eq.${schoolId}` }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          await db.meals.put(payload.new as Meal);
          window.dispatchEvent(new Event('sync-queue-updated'));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits', filter: `school_id=eq.${schoolId}` }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          await db.deposits.put(payload.new as Deposit);
          window.dispatchEvent(new Event('sync-queue-updated'));
        }
      })
      .subscribe();

    realtimeSubscription = channel;

    return () => {
      if (realtimeSubscription) {
        client.removeChannel(realtimeSubscription);
        realtimeSubscription = null;
      }
    };
  } catch (err) {
    console.error('Erreur initialisation Realtime :', err);
    return () => {};
  }
}

/**
 * Resets and reconnects the realtime subscription to the newly active school
 */
export function resetRealtimeSync(): void {
  const client = getSupabaseClient();
  if (client && realtimeSubscription) {
    try {
      client.removeChannel(realtimeSubscription);
    } catch {
      // ignore
    }
    realtimeSubscription = null;
  }
  initRealtimeSync();
}
