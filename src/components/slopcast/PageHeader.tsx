import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ThemeMeta, ColorMode } from '../../theme/themes';
import DesignWorkspaceTabs, { DesignWorkspace } from './DesignWorkspaceTabs';

type ViewMode = 'DASHBOARD' | 'ANALYSIS';

interface PageHeaderProps {
  isClassic: boolean;
  theme: ThemeMeta;
  themes: ThemeMeta[];
  themeId: string;
  setThemeId: (id: string) => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  designWorkspace: DesignWorkspace;
  onSetDesignWorkspace: (workspace: DesignWorkspace) => void;
  economicsNeedsAttention: boolean;
  wellsNeedsAttention: boolean;
  onNavigateHub: () => void;
  atmosphericOverlays: string[];
  headerAtmosphereClass: string;
  fxClass: string;
  colorMode?: ColorMode;
  onSetColorMode?: (mode: ColorMode) => void;
  effectiveMode?: 'dark' | 'light';
  onShare?: () => void;
  onRestartTour?: () => void;
}

const ThemeDropdown: React.FC<{
  themes: ThemeMeta[];
  themeId: string;
  currentTheme: ThemeMeta;
  isClassic: boolean;
  onSelect: (id: string) => void;
}> = ({ themes, themeId, currentTheme, isClassic, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative z-10 shrink-0">
      <motion.button
        onClick={() => setOpen(prev => !prev)}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        data-testid="theme-dropdown-toggle"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold theme-transition ${
          isClassic
            ? 'bg-black/25 border-black/30 text-white hover:bg-black/35'
            : 'bg-theme-bg border-theme-border text-theme-text hover:border-theme-cyan'
        }`}
      >
        <span className="text-xs">{currentTheme.icon}</span>
        <span className="hidden sm:inline">{currentTheme.label}</span>
        <span className={`text-[10px] opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ transformOrigin: 'top right' }}
            className={`absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-panel border shadow-card overflow-hidden theme-transition ${
              isClassic ? 'bg-black/80 border-black/40 backdrop-blur-md' : 'bg-theme-surface1 border-theme-border backdrop-blur-md'
            }`}
          >
            {themes.map(t => (
              <motion.button
                key={t.id}
                onClick={() => { onSelect(t.id); setOpen(false); }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                data-testid={`theme-option-${t.id}`}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] font-bold transition-colors ${
                  isClassic
                    ? `${themeId === t.id ? 'bg-theme-warning/20 text-theme-warning' : 'text-white/80 hover:bg-white/10'}`
                    : `${themeId === t.id ? 'bg-theme-cyan/10 text-theme-cyan' : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'}`
                }`}
              >
                <span className="text-xs">{t.icon}</span>
                <span>{t.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface OverflowMenuProps {
  isClassic: boolean;
  theme: ThemeMeta;
  onShare?: () => void;
  onRestartTour?: () => void;
  onSetColorMode?: (mode: ColorMode) => void;
  colorMode?: ColorMode;
  effectiveMode?: 'dark' | 'light';
}

const OverflowMenu: React.FC<OverflowMenuProps> = ({
  isClassic,
  theme,
  onShare,
  onRestartTour,
  onSetColorMode,
  effectiveMode = 'dark',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasAnyActions = onShare || onRestartTour || (onSetColorMode && theme.hasLightVariant);

  if (!hasAnyActions) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={
          isClassic
            ? 'w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center theme-transition border-2 shadow-card bg-black/15 text-white/90 border-black/25 hover:bg-black/20'
            : 'w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center theme-transition bg-theme-surface2 border border-theme-border text-theme-text hover:bg-theme-surface3'
        }
        title="More options"
      >
        <span className="text-base">⋮</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ transformOrigin: 'top right' }}
            className={
              isClassic
                ? 'absolute right-0 top-full mt-2 w-48 rounded-md border-2 shadow-card theme-transition bg-theme-surface1 border-black/30 overflow-hidden'
                : 'absolute right-0 top-full mt-2 w-48 rounded-panel border shadow-lg theme-transition bg-theme-surface1 border-theme-border overflow-hidden'
            }
          >
            <div className="py-1">
              {onShare && (
                <motion.button
                  onClick={() => {
                    onShare();
                    setIsOpen(false);
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={
                    isClassic
                      ? 'w-full px-4 py-2 text-left text-xs uppercase font-bold tracking-widest theme-transition text-white/90 hover:bg-black/20'
                      : 'w-full px-4 py-2 text-left text-xs uppercase font-bold tracking-widest theme-transition text-theme-text hover:bg-theme-surface2'
                  }
                >
                  Share
                </motion.button>
              )}

              {onRestartTour && (
                <motion.button
                  onClick={() => {
                    onRestartTour();
                    setIsOpen(false);
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={
                    isClassic
                      ? 'w-full px-4 py-2 text-left text-xs uppercase font-bold tracking-widest theme-transition text-white/90 hover:bg-black/20'
                      : 'w-full px-4 py-2 text-left text-xs uppercase font-bold tracking-widest theme-transition text-theme-text hover:bg-theme-surface2'
                  }
                >
                  Tour
                </motion.button>
              )}

              {onSetColorMode && theme.hasLightVariant && (
                <motion.button
                  onClick={() => {
                    onSetColorMode(effectiveMode === 'dark' ? 'light' : 'dark');
                    setIsOpen(false);
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={
                    isClassic
                      ? 'w-full px-4 py-2 text-left text-xs uppercase font-bold tracking-widest theme-transition text-white/90 hover:bg-black/20 flex items-center gap-2'
                      : 'w-full px-4 py-2 text-left text-xs uppercase font-bold tracking-widest theme-transition text-theme-text hover:bg-theme-surface2 flex items-center gap-2'
                  }
                >
                  <span className="text-sm">{effectiveMode === 'dark' ? '☀' : '☾'}</span>
                  <span>{effectiveMode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PageHeader: React.FC<PageHeaderProps> = ({
  isClassic,
  theme,
  themes,
  themeId,
  setThemeId,
  viewMode,
  onSetViewMode,
  designWorkspace,
  onSetDesignWorkspace,
  economicsNeedsAttention,
  wellsNeedsAttention,
  onNavigateHub,
  atmosphericOverlays,
  headerAtmosphereClass,
  fxClass,
  colorMode,
  onSetColorMode,
  effectiveMode = 'dark',
  onShare,
  onRestartTour,
}) => {
  return (
    <header
      className={`px-3 md:px-6 py-3 sticky top-0 z-20 theme-transition ${
        isClassic ? 'sc-header' : 'backdrop-blur-md border-b shadow-sm bg-theme-surface1/80 border-theme-border'
      } ${headerAtmosphereClass} ${fxClass}`}
    >
      {atmosphericOverlays.map(cls => (
        <div key={cls} className={`${cls} ${fxClass}`} />
      ))}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 md:gap-4 items-start md:items-center">
        <div className="min-w-0 flex flex-col gap-2">
          {/* Brand row */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div
              className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center theme-transition overflow-hidden shrink-0 ${
                isClassic ? 'rounded-full border border-black/30 shadow-card bg-theme-magenta' : 'rounded-panel bg-theme-surface2 border border-theme-border'
              }`}
            >
              {isClassic ? (
                <span className="text-white font-black text-lg md:text-xl leading-none">SL</span>
              ) : (
                <img
                  src="sandbox:/mnt/data/slopcast_logo_transparent.png"
                  alt="SC"
                  className="w-full h-full object-contain"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent && !parent.querySelector('.brand-fallback')) {
                      const span = document.createElement('span');
                      span.innerText = theme.appName.substring(0, 2);
                      span.className = 'text-theme-cyan brand-title text-xl brand-fallback';
                      parent.appendChild(span);
                    }
                  }}
                />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <h1
                className={`text-lg md:text-2xl leading-tight theme-transition tracking-tight ${
                  isClassic ? 'text-white font-black uppercase' : `text-theme-cyan ${theme.features.brandFont ? 'brand-title' : 'font-bold'}`
                }`}
              >
                {theme.appName}
              </h1>
              <span
                className={`text-[10px] md:text-xs uppercase font-bold tracking-[0.2em] theme-transition ${
                  isClassic ? 'text-theme-warning' : 'text-theme-magenta'
                }`}
              >
                {theme.appSubtitle}
              </span>
            </div>
          </div>

          {/* Separator between brand and nav */}
          <div className={`border-t theme-transition ${isClassic ? 'border-black/15' : 'border-theme-border/40'}`} />

          {/* Navigation tabs row */}
          <div className="flex items-center gap-2 w-full min-w-0 flex-nowrap">
            <div className={isClassic ? 'flex items-center gap-1.5 min-w-0 flex-nowrap' : 'flex items-center gap-1 p-1 rounded-panel border theme-transition bg-theme-bg border-theme-border min-w-0 flex-nowrap'}>
              <motion.button
                onClick={onNavigateHub}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className={
                  isClassic
                    ? 'px-2 md:px-3 lg:px-4 py-2.5 md:py-2.5 min-h-[44px] rounded-md text-[10px] md:text-xs lg:text-xs font-black uppercase tracking-widest theme-transition border-2 shadow-card bg-black/15 text-white/90 border-black/25 hover:bg-black/20 whitespace-nowrap'
                    : 'px-2 md:px-3 lg:px-4 py-2.5 md:py-2.5 min-h-[44px] rounded-inner text-[10px] md:text-xs lg:text-xs font-bold uppercase tracking-widest theme-transition text-theme-muted hover:text-theme-text whitespace-nowrap'
                }
              >
                HUB
              </motion.button>
              <motion.button
                onClick={() => onSetViewMode('DASHBOARD')}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className={
                  isClassic
                    ? `px-2 md:px-4 lg:px-5 py-2.5 md:py-2.5 min-h-[44px] rounded-md text-[10px] md:text-xs lg:text-xs font-black uppercase tracking-widest theme-transition border-2 shadow-card whitespace-nowrap ${
                        viewMode === 'DASHBOARD'
                          ? 'bg-theme-cyan text-white border-theme-magenta'
                        : 'bg-black/15 text-white/90 border-black/25 hover:bg-black/20'
                      }`
                    : `px-2 md:px-4 lg:px-5 py-2.5 md:py-2.5 min-h-[44px] rounded-inner text-[10px] md:text-xs lg:text-xs font-bold uppercase tracking-widest theme-transition whitespace-nowrap ${
                        viewMode === 'DASHBOARD'
                          ? 'bg-theme-cyan text-theme-bg shadow-glow-cyan'
                        : 'text-theme-muted hover:text-theme-text'
                      }`
                }
              >
                DESIGN
              </motion.button>
              <motion.button
                onClick={() => onSetViewMode('ANALYSIS')}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className={
                  isClassic
                    ? `px-2 md:px-4 lg:px-5 py-2.5 md:py-2.5 min-h-[44px] rounded-md text-[10px] md:text-xs lg:text-xs font-black uppercase tracking-widest theme-transition border-2 shadow-card whitespace-nowrap ${
                        viewMode === 'ANALYSIS'
                          ? 'bg-theme-cyan text-white border-theme-magenta'
                        : 'bg-black/15 text-white/90 border-black/25 hover:bg-black/20'
                      }`
                    : `px-2 md:px-4 lg:px-5 py-2.5 md:py-2.5 min-h-[44px] rounded-inner text-[10px] md:text-xs lg:text-xs font-bold uppercase tracking-widest theme-transition whitespace-nowrap ${
                        viewMode === 'ANALYSIS'
                          ? 'bg-theme-cyan text-theme-bg shadow-glow-cyan'
                        : 'text-theme-muted hover:text-theme-text'
                      }`
                }
              >
                SCENARIOS
              </motion.button>
            </div>

            {viewMode === 'DASHBOARD' && (
              <div className="min-w-0 flex-1">
                <DesignWorkspaceTabs
                  isClassic={isClassic}
                  workspace={designWorkspace}
                  onChange={onSetDesignWorkspace}
                  economicsNeedsAttention={economicsNeedsAttention}
                  wellsNeedsAttention={wellsNeedsAttention}
                  compact
                />
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex items-center justify-between md:justify-end gap-2">
          {/* Overflow menu for secondary actions */}
          <OverflowMenu
            isClassic={isClassic}
            theme={theme}
            onShare={onShare}
            onRestartTour={onRestartTour}
            onSetColorMode={onSetColorMode}
            effectiveMode={effectiveMode}
          />

          {/* Theme dropdown selector */}
          <ThemeDropdown
            themes={themes}
            themeId={themeId}
            currentTheme={theme}
            isClassic={isClassic}
            onSelect={setThemeId}
          />
        </div>
      </div>

    </header>
  );
};

export default React.memo(PageHeader);
