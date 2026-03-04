import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DevBypassAdapter } from './adapters/devBypassAdapter';
import { SupabaseAdapter } from './adapters/supabaseAdapter';
import { AuthAdapter } from './provider';
import { AuthSession, AuthState, SignInInput } from './types';

interface AuthContextValue extends AuthState {
  signIn: (input?: SignInInput) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function createAdapter(): AuthAdapter {
  const selected = (import.meta.env.VITE_AUTH_PROVIDER || 'dev-bypass').toString();
  if (selected === 'supabase') {
    return new SupabaseAdapter();
  }
  return new DevBypassAdapter();
}

const adapter = createAdapter();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ status: 'loading', session: null });

  useEffect(() => {
    let active = true;

    adapter
      .initialize()
      .then((session) => {
        if (!active) return;
        setState({ status: session ? 'authenticated' : 'unauthenticated', session });
      })
      .catch(() => {
        if (!active) return;
        setState({ status: 'unauthenticated', session: null });
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (input?: SignInInput) => {
    const session = await adapter.signIn(input);
    setState({ status: 'authenticated', session });
    return session;
  }, []);

  const signOut = useCallback(async () => {
    await adapter.signOut();
    setState({ status: 'unauthenticated', session: null });
  }, []);

  const refreshSession = useCallback(() => {
    const session = adapter.getSession();
    setState({ status: session ? 'authenticated' : 'unauthenticated', session });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    signIn,
    signOut,
    refreshSession,
  }), [state, signIn, signOut, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within <AuthProvider>');
  return context;
}
