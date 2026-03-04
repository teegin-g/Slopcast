import { AuthAdapter, readStoredSession, writeStoredSession } from '../provider';
import { AuthSession, SignInInput } from '../types';

const DEFAULT_EMAIL = 'demo@slopcast.local';
const DEFAULT_NAME = 'Demo Operator';

function createDevSession(input?: SignInInput): AuthSession {
  const email = input?.email?.trim() || DEFAULT_EMAIL;
  const displayName = input?.displayName?.trim() || DEFAULT_NAME;
  return {
    provider: 'dev-bypass',
    createdAt: new Date().toISOString(),
    user: {
      id: 'dev-bypass-user',
      email,
      displayName,
    },
  };
}

export class DevBypassAdapter implements AuthAdapter {
  private session: AuthSession | null = null;

  async initialize(): Promise<AuthSession | null> {
    this.session = readStoredSession();
    return this.session;
  }

  async signIn(input?: SignInInput): Promise<AuthSession> {
    this.session = createDevSession(input);
    writeStoredSession(this.session);
    return this.session;
  }

  async signOut(): Promise<void> {
    this.session = null;
    writeStoredSession(null);
  }

  getSession(): AuthSession | null {
    return this.session;
  }
}
