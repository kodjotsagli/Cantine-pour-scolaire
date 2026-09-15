import { useState, useEffect, useCallback } from 'react';
import { getPendingSyncCount, processSyncQueue, type SyncResult } from '../services/syncService';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const refreshPending = useCallback(async () => {
    try {
      const count = await getPendingSyncCount();
      setPendingCount(count);
    } catch {
      // IndexedDB might not be ready yet
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await processSyncQueue();
      setLastSyncResult(res);
      await refreshPending();
    } catch (e: any) {
      setLastSyncResult({
        success: false,
        syncedCount: 0,
        message: e?.message || 'Erreur lors de la synchronisation'
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPending]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto sync when coming back online
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    const handleQueueUpdate = () => {
      refreshPending();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sync-queue-updated', handleQueueUpdate);

    refreshPending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-queue-updated', handleQueueUpdate);
    };
  }, [refreshPending, triggerSync]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncResult,
    triggerSync,
    refreshPending
  };
}
