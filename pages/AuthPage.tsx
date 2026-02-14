import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../theme/ThemeProvider';

const AuthPage: React.FC = () => {
  const { status, signIn } = useAuth();
  const { themeId, themes, setThemeId } = useTheme();
  const isClassic = themeId === 'mario';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectTarget = useMemo(() => {
    const target = searchParams.get('redirect');
    if (!target || !target.startsWith('/')) return '/';
    return target;
  }, [searchParams]);

  const [email, setEmail] = useState('demo@slopcast.local');
  const [displayName, setDisplayName] = useState('Demo Operator');
  const [error, setError] = useState<string>('');
  const [pending, setPending] = useState(false);

  const handleBypassSignIn = async () => {
    setPending(true);
    setError('');
    try {
      await signIn({ email, displayName });
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in.';
      setError(message);
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      navigate(redirectTarget, { replace: true });
    }
  }, [status, navigate, redirectTarget]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent theme-transition px-4 py-8">
      {!isClassic && (
        <>
          <div className="sc-pageAmbient" />
          <div className="sc-pageAmbientOrbLeft" />
          <div className="sc-pageAmbientOrbRight" />
        </>
      )}

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className={`mb-6 p-4 md:p-5 rounded-panel border theme-transition ${isClassic ? 'sc-panel' : 'bg-theme-surface1/80 border-theme-border shadow-card'}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-[10px] uppercase tracking-[0.28em] mb-2 ${isClassic ? 'text-theme-warning font-black' : 'text-theme-magenta font-black'}`}>
                Access Control
              </p>
              <h1 className={`text-2xl md:text-3xl leading-tight ${isClassic ? 'text-white font-black uppercase' : 'text-theme-text font-black tracking-tight'}`}>
                Sign In To Slopcast Hub
              </h1>
            </div>
            <div className={`flex items-center rounded-full p-1 border theme-transition ${isClassic ? 'bg-black/25 border-black/30' : 'bg-theme-bg border-theme-border'}`}>
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={
                    isClassic
                      ? `w-8 h-8 rounded-full flex items-center justify-center theme-transition ${
                          themeId === t.id ? 'bg-theme-warning text-black scale-110 shadow-card' : 'text-white/80 hover:text-white'
                        }`
                      : `w-8 h-8 rounded-full flex items-center justify-center theme-transition ${
                          themeId === t.id ? 'bg-theme-cyan text-theme-bg scale-110 shadow-glow-cyan' : 'text-theme-muted hover:text-theme-text'
                        }`
                  }
                  title={t.label}
                >
                  <span className="text-xs">{t.icon}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className={`lg:col-span-7 rounded-panel border p-5 md:p-6 theme-transition ${isClassic ? 'sc-panel' : 'bg-theme-surface1/75 border-theme-border shadow-card'}`}>
            <p className={`text-[10px] uppercase tracking-[0.24em] mb-3 ${isClassic ? 'text-theme-warning font-black' : 'text-theme-lavender font-black'}`}>
              Local Verification Mode
            </p>
            <h2 className={`text-2xl md:text-4xl leading-[0.95] ${isClassic ? 'text-white font-black uppercase' : 'text-theme-text font-black tracking-tight'}`}>
              Use a bypass session now,
              <br />
              swap in Supabase later.
            </h2>
            <p className={`mt-4 max-w-2xl text-sm md:text-base ${isClassic ? 'text-white/85' : 'text-theme-muted'}`}>
              This flow intentionally validates guarded routes and user-state transitions without external provider setup. The auth adapter is structured so Supabase can replace this with minimal UI churn.
            </p>

            <div className="mt-6 rounded-inner border p-4 md:p-5 bg-theme-bg border-theme-border/70">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className={`text-[10px] uppercase tracking-[0.2em] block mb-2 ${isClassic ? 'text-theme-warning font-black' : 'text-theme-muted font-black'}`}>
                    Demo Email
                  </span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-inner border px-3 py-2 text-sm bg-theme-surface1 border-theme-border text-theme-text outline-none focus:border-theme-cyan"
                  />
                </label>
                <label className="block">
                  <span className={`text-[10px] uppercase tracking-[0.2em] block mb-2 ${isClassic ? 'text-theme-warning font-black' : 'text-theme-muted font-black'}`}>
                    Display Name
                  </span>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-inner border px-3 py-2 text-sm bg-theme-surface1 border-theme-border text-theme-text outline-none focus:border-theme-cyan"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleBypassSignIn}
                  disabled={pending}
                  className={
                    isClassic
                      ? 'rounded-inner px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-theme-cyan text-white border border-theme-magenta/60 shadow-card disabled:opacity-70'
                      : 'rounded-inner px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-theme-cyan text-theme-bg shadow-glow-cyan disabled:opacity-70'
                  }
                >
                  {pending ? 'Signing In...' : 'Sign In As Demo User'}
                </button>
                <button
                  disabled
                  className={
                    isClassic
                      ? 'rounded-inner px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-black/20 text-white/60 border border-black/25 cursor-not-allowed'
                      : 'rounded-inner px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-theme-surface2 text-theme-muted border border-theme-border cursor-not-allowed'
                  }
                >
                  Supabase Login (Setup Pending)
                </button>
              </div>

              {error && (
                <p className="mt-3 text-xs text-theme-danger">{error}</p>
              )}
            </div>
          </section>

          <aside className={`lg:col-span-5 rounded-panel border p-5 md:p-6 theme-transition ${isClassic ? 'sc-panel' : 'bg-theme-surface1/65 border-theme-border shadow-card'}`}>
            <h3 className={`text-[11px] uppercase tracking-[0.3em] mb-4 ${isClassic ? 'text-theme-warning font-black' : 'text-theme-cyan font-black'}`}>
              Route Guard Preview
            </h3>
            <div className="space-y-3">
              <div className="rounded-inner border px-3 py-3 text-xs bg-theme-bg border-theme-border/70 text-theme-muted">
                Protected destination: <span className="text-theme-text font-semibold">{redirectTarget}</span>
              </div>
              <div className="rounded-inner border px-3 py-3 text-xs bg-theme-bg border-theme-border/70 text-theme-muted">
                Provider mode: <span className="text-theme-text font-semibold">dev-bypass</span>
              </div>
              <div className="rounded-inner border px-3 py-3 text-xs bg-theme-bg border-theme-border/70 text-theme-muted">
                Supabase-ready adapter exists and can be wired by setting <span className="text-theme-text font-semibold">VITE_AUTH_PROVIDER=supabase</span>.
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default AuthPage;
