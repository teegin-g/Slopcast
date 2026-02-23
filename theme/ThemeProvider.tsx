import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeId, ThemeMeta, ColorMode, DEFAULT_THEME, getTheme, THEMES } from './themes';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemeMeta;
  themes: ThemeMeta[];
  setThemeId: (id: ThemeId) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  effectiveMode: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'slopcast-theme';
const COLOR_MODE_KEY = 'slopcast-color-mode';

function readStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && THEMES.some(t => t.id === raw)) return raw as ThemeId;
  } catch { /* SSR / incognito – fall through */ }
  return DEFAULT_THEME;
}

function readStoredColorMode(): ColorMode {
  try {
    const raw = localStorage.getItem(COLOR_MODE_KEY);
    if (raw === 'dark' || raw === 'light' || raw === 'system') return raw;
  } catch { /* ignore */ }
  return 'dark';
}

function getSystemPreference(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyThemeToDOM(id: ThemeId, mode: 'dark' | 'light') {
  document.documentElement.dataset.theme = id;
  document.documentElement.dataset.mode = mode;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdRaw] = useState<ThemeId>(readStoredTheme);
  const [colorMode, setColorModeRaw] = useState<ColorMode>(readStoredColorMode);

  const theme = useMemo(() => getTheme(themeId), [themeId]);

  const effectiveMode = useMemo<'dark' | 'light'>(() => {
    if (colorMode === 'system') {
      const sysPref = getSystemPreference();
      return theme.hasLightVariant ? sysPref : 'dark';
    }
    if (colorMode === 'light' && !theme.hasLightVariant) return 'dark';
    return colorMode;
  }, [colorMode, theme.hasLightVariant]);

  // Apply on first render and changes
  useEffect(() => { applyThemeToDOM(themeId, effectiveMode); }, [themeId, effectiveMode]);

  // Listen for system preference changes when in 'system' mode
  useEffect(() => {
    if (colorMode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => applyThemeToDOM(themeId, theme.hasLightVariant && mql.matches ? 'light' : 'dark');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [colorMode, themeId, theme.hasLightVariant]);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdRaw(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeRaw(mode);
    try { localStorage.setItem(COLOR_MODE_KEY, mode); } catch { /* ignore */ }
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    themeId,
    theme,
    themes: THEMES,
    setThemeId,
    colorMode,
    setColorMode,
    effectiveMode,
  }), [themeId, theme, setThemeId, colorMode, setColorMode, effectiveMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme() must be used within <ThemeProvider>');
  return ctx;
}
