import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeId, ThemeMeta, DEFAULT_THEME, getTheme, THEMES } from './themes';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemeMeta;
  themes: ThemeMeta[];
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'slopcast-theme';

function readStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && THEMES.some(t => t.id === raw)) return raw as ThemeId;
  } catch { /* SSR / incognito – fall through */ }
  return DEFAULT_THEME;
}

function applyThemeToDOM(id: ThemeId) {
  document.documentElement.dataset.theme = id;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdRaw] = useState<ThemeId>(readStoredTheme);

  // Apply on first render
  useEffect(() => { applyThemeToDOM(themeId); }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdRaw(id);
    applyThemeToDOM(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    themeId,
    theme: getTheme(themeId),
    themes: THEMES,
    setThemeId,
  }), [themeId, setThemeId]);

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
