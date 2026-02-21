import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null | undefined;

function readPublicKey(): string | undefined {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
}

export function hasSupabaseEnv(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = readPublicKey();
  return typeof url === 'string' && url.trim().length > 0 && typeof key === 'string' && key.trim().length > 0;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = readPublicKey();
  if (typeof url !== 'string' || url.trim().length === 0) {
    cachedClient = null;
    return cachedClient;
  }
  if (typeof key !== 'string' || key.trim().length === 0) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(url, key);
  return cachedClient;
}
