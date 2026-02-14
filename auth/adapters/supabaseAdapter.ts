import { AuthAdapter } from '../provider';
import { AuthSession, SignInInput } from '../types';

/**
 * Placeholder adapter for future Supabase integration.
 * TODO: replace with real Supabase client wiring once project credentials exist.
 */
export class SupabaseAdapter implements AuthAdapter {
  async initialize(): Promise<AuthSession | null> {
    return null;
  }

  async signIn(_input?: SignInInput): Promise<AuthSession> {
    throw new Error('Supabase auth is not configured yet. Use the dev bypass sign-in flow.');
  }

  async signOut(): Promise<void> {
    return;
  }

  getSession(): AuthSession | null {
    return null;
  }
}
