import { getSupabaseClient } from '../../services/supabaseClient';
import { AuthAdapter } from '../provider';
import { AuthSession, SignInInput } from '../types';

const DEFAULT_EMAIL = 'anonymous@slopcast.local';

function buildSession(user: { id: string; email?: string | null }, input?: SignInInput): AuthSession {
  return {
    provider: 'supabase',
    createdAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email || input?.email?.trim() || DEFAULT_EMAIL,
      displayName: input?.displayName?.trim(),
    },
  };
}

export class SupabaseAdapter implements AuthAdapter {
  private session: AuthSession | null = null;

  async initialize(): Promise<AuthSession | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const [{ data, error }, userRes] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser(),
    ]);
    if (error || userRes.error) return null;
    if (!data.session || !userRes.data.user?.id) return null;

    this.session = buildSession(userRes.data.user);
    return this.session;
  }

  async signIn(input?: SignInInput): Promise<AuthSession> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.');
    }

    const { error } = await supabase.auth.signInAnonymously({
      options: input?.displayName
        ? {
            data: {
              display_name: input.displayName.trim(),
            },
          }
        : undefined,
    });
    if (error) throw error;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user?.id) {
      throw userError || new Error('Supabase sign-in did not return a user.');
    }

    this.session = buildSession(userData.user, input);
    return this.session;
  }

  async signOut(): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    this.session = null;
  }

  getSession(): AuthSession | null {
    return this.session;
  }
}
