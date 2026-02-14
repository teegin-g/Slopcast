import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../theme/ThemeProvider';

interface AppModule {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'coming_soon';
  actionLabel: string;
}

const modules: AppModule[] = [
  {
    id: 'slopcast',
    name: 'Slopcast',
    description: 'Economic design and scenario analysis for O&G portfolios.',
    status: 'available',
    actionLabel: 'Open App',
  },
  {
    id: 'flowline',
    name: 'Flowline',
    description: 'Production telemetry and field performance monitor.',
    status: 'coming_soon',
    actionLabel: 'Coming Soon',
  },
  {
    id: 'hedgelab',
    name: 'HedgeLab',
    description: 'Price deck stress testing and hedge strategy planner.',
    status: 'coming_soon',
    actionLabel: 'Coming Soon',
  },
  {
    id: 'capexforge',
    name: 'CapexForge',
    description: 'AACE-aligned cost templates and sanction memo drafting.',
    status: 'coming_soon',
    actionLabel: 'Coming Soon',
  },
];

function formatDateTime(value?: string): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

const HubPage: React.FC = () => {
  const navigate = useNavigate();
  const { status, session, signOut, refreshSession } = useAuth();
  const { themeId, themes, setThemeId } = useTheme();

  const isClassic = themeId === 'mario';
  const isAuthenticated = status === 'authenticated';

  const openSlopcast = () => {
    if (isAuthenticated) {
      navigate('/slopcast');
      return;
    }
    navigate('/auth?redirect=%2Fslopcast');
  };

  const openSignIn = () => {
    navigate('/auth');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const activityItems = [
    isAuthenticated ? `Last session start: ${formatDateTime(session?.createdAt)}` : 'No active session',
    isAuthenticated ? `Account: ${session?.user.email}` : 'Sign in to enable protected apps',
    'Workspace: Slopcast Core',
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent theme-transition">
      {!isClassic && (
        <>
          <div className="sc-pageAmbient" />
          <div className="sc-pageAmbientOrbLeft" />
          <div className="sc-pageAmbientOrbRight" />
        </>
      )}

      <header
        className={`relative z-20 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b theme-transition ${
          isClassic ? 'sc-header' : 'bg-theme-surface1/80 backdrop-blur-md border-theme-border'
        }`}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div
            className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center theme-transition ${
              isClassic ? 'rounded-full border border-black/30 bg-theme-magenta' : 'rounded-panel bg-theme-surface2 border border-theme-border'
            }`}
          >
            <span className={isClassic ? 'text-white font-black text-base' : 'text-theme-cyan font-black text-base'}>SC</span>
          </div>
          <div>
            <h1
              className={`text-base md:text-xl leading-tight tracking-tight ${
                isClassic ? 'text-white font-black uppercase' : 'text-theme-cyan font-bold'
              }`}
            >
              Slopcast Command Hub
            </h1>
            <p className={`text-[9px] md:text-[10px] uppercase tracking-[0.22em] ${isClassic ? 'text-theme-warning font-black' : 'text-theme-magenta font-bold'}`}>
              Multi-app launcher
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={isAuthenticated ? openSlopcast : openSignIn}
            className={
              isClassic
                ? 'px-3 md:px-4 py-2 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 border-black/20 bg-theme-cyan text-white shadow-card'
                : 'px-3 md:px-4 py-2 rounded-panel text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-theme-cyan text-theme-bg shadow-glow-cyan hover:brightness-105 transition-all'
            }
          >
            {isAuthenticated ? 'Resume Slopcast' : 'Sign In'}
          </button>

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

      <main className="relative z-10 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 md:gap-6">
          <section className="xl:col-span-8 space-y-5 md:space-y-6">
            <div className={`rounded-panel border p-5 md:p-8 theme-transition ${isClassic ? 'sc-panel' : 'bg-theme-surface1/80 border-theme-border shadow-card'}`}>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 md:gap-6">
                <div className="max-w-3xl space-y-3 md:space-y-4">
                  <p className={`text-[10px] uppercase tracking-[0.28em] ${isClassic ? 'text-theme-warning font-black' : 'text-theme-lavender font-bold'}`}>
                    Initial access layer
                  </p>
                  <h2 className={`text-[1.8rem] md:text-5xl leading-[0.95] ${isClassic ? 'text-white font-black uppercase' : 'text-theme-text font-black tracking-tight'}`}>
                    One launch surface for Slopcast and every tool you add next.
                  </h2>
                  <p className={`text-sm md:text-base max-w-2xl ${isClassic ? 'text-white/85' : 'text-theme-muted'}`}>
                    Start with Slopcast today. Expand this command hub into a full operational suite with shared identity, quick-switch navigation, and consistent themed UI.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <button
                    onClick={openSlopcast}
                    className={
                      isClassic
                        ? 'px-5 py-3 rounded-md text-[10px] font-black uppercase tracking-widest border-2 border-theme-magenta bg-theme-cyan text-white shadow-card'
                        : 'px-5 py-3 rounded-panel text-[10px] font-black uppercase tracking-widest bg-theme-cyan text-theme-bg shadow-glow-cyan hover:scale-[1.02] transition-transform'
                    }
                  >
                    {isAuthenticated ? 'Open Slopcast' : 'Sign In To Access'}
                  </button>
                  <button
                    onClick={refreshSession}
                    className={
                      isClassic
                        ? 'px-5 py-3 rounded-md text-[10px] font-black uppercase tracking-widest border-2 border-black/20 bg-black/20 text-white'
                        : 'px-5 py-3 rounded-panel text-[10px] font-black uppercase tracking-widest border border-theme-border bg-theme-bg text-theme-muted hover:text-theme-text transition-colors'
                    }
                  >
                    Refresh Session
                  </button>
                </div>
              </div>
            </div>

            <div className={`rounded-panel border p-5 md:p-6 theme-transition ${isClassic ? 'sc-panel' : 'bg-theme-surface1/60 border-theme-border shadow-card'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-[11px] uppercase tracking-[0.3em] ${isClassic ? 'text-theme-warning font-black' : 'text-theme-cyan font-black'}`}>
                  App Navigation
                </h3>
                <span className={`text-[10px] uppercase tracking-[0.2em] ${isClassic ? 'text-white/70 font-black' : 'text-theme-muted font-bold'}`}>
                  {modules.length} Modules
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map(module => {
                  const isAvailable = module.status === 'available';
                  const canLaunch = isAvailable && isAuthenticated;
                  return (
                    <article
                      key={module.id}
                      className={`rounded-inner border p-4 md:p-5 transition-all ${
                        isClassic
                          ? canLaunch
                            ? 'bg-black/20 border-theme-cyan/60'
                            : 'bg-black/15 border-black/25 opacity-90'
                          : canLaunch
                            ? 'bg-theme-bg border-theme-cyan/40 hover:border-theme-cyan'
                            : 'bg-theme-bg/70 border-theme-border opacity-90'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h4 className={`text-base ${isClassic ? 'text-white font-black uppercase' : 'text-theme-text font-black tracking-tight'}`}>
                            {module.name}
                          </h4>
                          <p className={`mt-2 text-xs leading-relaxed ${isClassic ? 'text-white/80' : 'text-theme-muted'}`}>
                            {module.description}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-[9px] uppercase tracking-[0.2em] rounded ${
                            isClassic
                              ? canLaunch
                                ? 'bg-theme-warning text-black font-black'
                                : 'bg-black/35 text-white/70 font-black'
                              : canLaunch
                                ? 'bg-theme-cyan text-theme-bg font-black'
                                : 'bg-theme-surface2 text-theme-muted font-black border border-theme-border'
                          }`}
                        >
                          {isAvailable ? (isAuthenticated ? 'Active' : 'Sign In') : 'Soon'}
                        </span>
                      </div>

                      <button
                        disabled={!isAvailable}
                        onClick={isAvailable ? openSlopcast : undefined}
                        className={`w-full rounded-inner px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-black transition-all ${
                          isClassic
                            ? isAvailable
                              ? 'bg-theme-cyan text-white border border-theme-magenta/60 shadow-card'
                              : 'bg-black/25 text-white/50 border border-black/20 cursor-not-allowed'
                            : isAvailable
                              ? 'bg-theme-cyan text-theme-bg hover:brightness-105 shadow-glow-cyan'
                              : 'bg-theme-surface2 text-theme-muted border border-theme-border cursor-not-allowed'
                        }`}
                      >
                        {isAvailable ? (isAuthenticated ? module.actionLabel : 'Sign In') : module.actionLabel}
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="xl:col-span-4 space-y-5 md:space-y-6">
            <div className={`rounded-panel border p-5 md:p-6 theme-transition ${isClassic ? 'sc-panel' : 'bg-theme-surface1/70 border-theme-border shadow-card'}`}>
              <h3 className={`text-[11px] uppercase tracking-[0.3em] mb-4 ${isClassic ? 'text-theme-warning font-black' : 'text-theme-magenta font-black'}`}>
                Account Dashboard
              </h3>

              <div className="rounded-inner border p-4 mb-4 theme-transition bg-theme-bg border-theme-border/70">
                <p className={`text-[10px] uppercase tracking-[0.2em] mb-2 ${isClassic ? 'text-white/70 font-black' : 'text-theme-muted font-bold'}`}>
                  Current Operator
                </p>
                <p className={`text-lg ${isClassic ? 'text-white font-black uppercase' : 'text-theme-text font-black tracking-tight'}`}>
                  {session?.user.displayName || 'Guest User'}
                </p>
                <p className={`text-xs mt-1 ${isClassic ? 'text-theme-warning' : 'text-theme-cyan'}`}>
                  {session?.user.email || 'No active sign-in'}
                </p>
              </div>

              <div className="space-y-2">
                {activityItems.map(item => (
                  <div
                    key={item}
                    className={`rounded-inner border px-3 py-2 text-xs ${
                      isClassic
                        ? 'border-black/25 bg-black/15 text-white/85'
                        : 'border-theme-border bg-theme-bg/70 text-theme-muted'
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-panel border p-5 theme-transition ${isClassic ? 'sc-panel' : 'bg-theme-surface1/60 border-theme-border shadow-card'}`}>
              <h3 className={`text-[11px] uppercase tracking-[0.3em] mb-3 ${isClassic ? 'text-theme-warning font-black' : 'text-theme-lavender font-black'}`}>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={isAuthenticated ? openSlopcast : openSignIn}
                  className={
                    isClassic
                      ? 'rounded-inner px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-theme-cyan text-white border border-theme-magenta/60 shadow-card'
                      : 'rounded-inner px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-theme-cyan text-theme-bg shadow-glow-cyan'
                  }
                >
                  {isAuthenticated ? 'Resume Slopcast' : 'Sign In'}
                </button>
                {isAuthenticated ? (
                  <button
                    onClick={handleSignOut}
                    className={
                      isClassic
                        ? 'rounded-inner px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-black/20 border border-black/25 text-white/90'
                        : 'rounded-inner px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-theme-bg border border-theme-border text-theme-muted hover:text-theme-text'
                    }
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={refreshSession}
                    className={
                      isClassic
                        ? 'rounded-inner px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-black/20 border border-black/25 text-white/90'
                        : 'rounded-inner px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-theme-bg border border-theme-border text-theme-muted hover:text-theme-text'
                    }
                  >
                    Sync Session
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default HubPage;
