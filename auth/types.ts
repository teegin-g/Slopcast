export type AuthProviderId = 'dev-bypass' | 'supabase';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
}

export interface AuthSession {
  user: AuthUser;
  provider: AuthProviderId;
  createdAt: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  session: AuthSession | null;
}

export interface SignInInput {
  email?: string;
  displayName?: string;
}
