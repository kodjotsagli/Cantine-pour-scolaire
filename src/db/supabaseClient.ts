import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; key: string } {
  const localUrl = localStorage.getItem('cantine_supabase_url') || '';
  const localKey = localStorage.getItem('cantine_supabase_anon_key') || '';

  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: localUrl || envUrl,
    key: localKey || envKey
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.startsWith('http') && key.length > 10);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getSupabaseConfig();
  if (url && key && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      return supabaseInstance;
    } catch (err) {
      console.error('Erreur initialisation client Supabase :', err);
      return null;
    }
  }

  return null;
}

export function setSupabaseConfig(url: string, key: string) {
  localStorage.setItem('cantine_supabase_url', url.trim());
  localStorage.setItem('cantine_supabase_anon_key', key.trim());
  supabaseInstance = null; // force re-creation
  window.dispatchEvent(new Event('supabase-config-changed'));
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase n\'est pas encore configuré. Veuillez renseigner l\'URL et la clé Anon.'
    };
  }

  try {
    const { data, error } = await client.from('schools').select('id, name').limit(1);
    if (error) {
      return {
        success: false,
        message: `Erreur de connexion Supabase : ${error.message}`
      };
    }

    return {
      success: true,
      message: `Connexion Cloud réussie ! ${data && data.length > 0 ? `École détectée : ${data[0].name}` : 'Base connectée et prête.'}`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Impossible de joindre le serveur Supabase : ${err?.message || 'Erreur réseau'}`
    };
  }
}
