// ---------------------------------------------------------------------------
// Theme Registry – single source of truth for every theme the app supports.
// Add a new entry here + a matching [data-theme='<id>'] block in theme.css and
// the rest of the UI will pick it up automatically.
// ---------------------------------------------------------------------------

export type ThemeId = 'slate' | 'synthwave' | 'tropical';

/** Per-theme chart series colors (Recharts / D3). */
export interface ChartPalette {
  oil: string;
  cash: string;
  lav: string;
  grid: string;
  text: string;
  surface: string;
  border: string;
}

/** Per-theme map visualization colors. */
export interface MapPalette {
  gridColor: string;
  gridOpacity: number;
  selectedStroke: string;
  glowColor: string;
  unassignedFill: string;
  lassoFill: string;
  lassoStroke: string;
  lassoDash: string;
}

/** Optional per-theme visual features. */
export interface ThemeFeatures {
  retroGrid: boolean;
  brandFont: boolean;       // use --font-brand (Orbitron, etc.)
  glowEffects: boolean;     // neon glow filters on map / cards
}

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  icon: string;              // emoji shown in theme picker
  description: string;
  appName: string;           // branding text in header
  appSubtitle: string;
  chartPalette: ChartPalette;
  mapPalette: MapPalette;
  features: ThemeFeatures;
}

// ---------------------------------------------------------------------------
// Theme definitions
// ---------------------------------------------------------------------------

const slate: ThemeMeta = {
  id: 'slate',
  label: 'Slate',
  icon: '🏢',
  description: 'Corporate blue-gray',
  appName: 'StrataValuator',
  appSubtitle: 'Deal Intelligence',
  chartPalette: {
    oil: '#3b82f6',
    cash: '#10b981',
    lav: '#8b5cf6',
    grid: '#1e293b',
    text: '#475569',
    surface: '#0f172a',
    border: '#334155',
  },
  mapPalette: {
    gridColor: '#1e293b',
    gridOpacity: 0.3,
    selectedStroke: '#ffffff',
    glowColor: '#3b82f6',
    unassignedFill: '#475569',
    lassoFill: 'rgba(59, 130, 246, 0.1)',
    lassoStroke: '#3b82f6',
    lassoDash: '4',
  },
  features: {
    retroGrid: false,
    brandFont: false,
    glowEffects: false,
  },
};

const synthwave: ThemeMeta = {
  id: 'synthwave',
  label: 'Synthwave',
  icon: '🕹️',
  description: 'Neon retro vibes',
  appName: 'SLOPCAST',
  appSubtitle: 'Electric Forecast',
  chartPalette: {
    oil: '#9ED3F0',
    cash: '#E566DA',
    lav: '#DBA1DD',
    grid: 'rgba(96, 83, 160, 0.25)',
    text: '#A8A3A8',
    surface: '#0E061A',
    border: 'rgba(96, 83, 160, 0.4)',
  },
  mapPalette: {
    gridColor: '#6053A0',
    gridOpacity: 0.4,
    selectedStroke: '#9ED3F0',
    glowColor: '#9ED3F0',
    unassignedFill: '#6053A0',
    lassoFill: 'rgba(229, 102, 218, 0.15)',
    lassoStroke: '#E566DA',
    lassoDash: '8, 4',
  },
  features: {
    retroGrid: true,
    brandFont: true,
    glowEffects: true,
  },
};

const tropical: ThemeMeta = {
  id: 'tropical',
  label: 'Tropical',
  icon: '🌴',
  description: 'Tommy Bahama resort',
  appName: 'SLOPCAST',
  appSubtitle: 'Island Economics',
  chartPalette: {
    oil: '#2dd4bf',      // teal-400
    cash: '#f97316',     // orange-500 (sunset coral)
    lav: '#c084fc',      // purple-400
    grid: 'rgba(45, 212, 191, 0.15)',
    text: '#94a3b8',
    surface: '#1a2332',
    border: 'rgba(45, 212, 191, 0.25)',
  },
  mapPalette: {
    gridColor: '#2dd4bf',
    gridOpacity: 0.15,
    selectedStroke: '#f97316',
    glowColor: '#2dd4bf',
    unassignedFill: '#5eead4',
    lassoFill: 'rgba(249, 115, 22, 0.12)',
    lassoStroke: '#f97316',
    lassoDash: '6, 3',
  },
  features: {
    retroGrid: false,
    brandFont: false,
    glowEffects: true,
  },
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const THEMES: ThemeMeta[] = [slate, synthwave, tropical];

export const DEFAULT_THEME: ThemeId = 'synthwave';

export function getTheme(id: ThemeId): ThemeMeta {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}
