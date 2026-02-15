import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function requiredEnv(name: string, value: string | undefined): string {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  throw new Error(
    `Missing ${name}. Add it to .env.local (Vite requires restarting the dev server after env changes).`
  );
}

/**
 * Supabase browser client.
 *
 * IMPORTANT:
 * - Use a public key only (Supabase "publishable"/"anon" key).
 * - Never put your Postgres connection string/password in Vite env vars.
 */
export const supabase: SupabaseClient = createClient(
  requiredEnv('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  requiredEnv(
    'VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  )
);

