import { AuthSession, SignInInput } from './types';

export interface AuthAdapter {
  initialize: () => Promise<AuthSession | null>;
  signIn: (input?: SignInInput) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  getSession: () => AuthSession | null;
}

export const AUTH_STORAGE_KEY = 'slopcast-auth-session';

export function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as Record<string, unknown>;
    const user = candidate.user as Record<string, unknown> | undefined;

    if (
      typeof candidate.provider !== 'string' ||
      typeof candidate.createdAt !== 'string' ||
      !user ||
      typeof user.id !== 'string' ||
      typeof user.email !== 'string'
    ) {
      return null;
    }

    return {
      provider: candidate.provider as AuthSession['provider'],
      createdAt: candidate.createdAt,
      user: {
        id: user.id,
        email: user.email,
        displayName: typeof user.displayName === 'string' ? user.displayName : undefined,
      },
    };
  } catch {
    return null;
  }
}

export function writeStoredSession(session: AuthSession | null): void {
  try {
    if (session) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return;
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage failures in restricted environments.
  }
}
