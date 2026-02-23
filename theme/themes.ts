// ---------------------------------------------------------------------------
// Theme Registry – single source of truth for every theme the app supports.
// Add a new entry here + a matching [data-theme='<id>'] block in theme.css and
// the rest of the UI will pick it up automatically.
// ---------------------------------------------------------------------------

import React from 'react';

export type ThemeId = string;

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

export type ColorMode = 'dark' | 'light' | 'system';

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
  /** Default variant for this theme */
  variant: 'dark' | 'light';
  /** Whether this theme has a light mode variant */
  hasLightVariant?: boolean;
  /** Optional animated background component for this theme */
  BackgroundComponent?: React.ComponentType;
  /** CSS class names for atmospheric overlay divs rendered in the header */
  atmosphericOverlays?: string[];
  /** CSS class applied to the header for atmospheric effects */
  headerAtmosphereClass?: string;
  /** CSS class applied to the page wrapper for atmospheric effects */
  atmosphereClass?: string;
  /** Whether this theme supports fx modes (cinematic/max) */
  fxTheme?: boolean;
}

// ---------------------------------------------------------------------------
// Lazy-loaded background components
// ---------------------------------------------------------------------------

const SynthwaveBackground = React.lazy(() => import('../components/SynthwaveBackground'));
const MoonlightBackground = React.lazy(() => import('../components/MoonlightBackground'));
const TropicalBackground = React.lazy(() => import('../components/TropicalBackground'));
const MarioOverworldBackground = React.lazy(() => import('../components/MarioOverworldBackground'));
const StormDuskBackground = React.lazy(() => import('../components/StormDuskBackground'));
const HyperboreaBackground = React.lazy(() => import('../components/HyperboreaBackground'));

// ---------------------------------------------------------------------------
// Theme definitions
// ---------------------------------------------------------------------------

const slate: ThemeMeta = {
  id: 'slate',
  variant: 'dark',
  hasLightVariant: true,
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
  variant: 'dark',
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
  BackgroundComponent: SynthwaveBackground,
  atmosphereClass: 'theme-atmo',
  headerAtmosphereClass: 'theme-atmo-header',
  atmosphericOverlays: ['theme-atmo-bands', 'theme-atmo-horizon', 'theme-atmo-ridges'],
  fxTheme: true,
};

const tropical: ThemeMeta = {
  id: 'tropical',
  variant: 'dark',
  label: 'Tropical',
  icon: '🌴',
  description: 'Tommy Bahama resort',
  appName: 'SLOPCAST',
  appSubtitle: 'Island Economics',
  chartPalette: {
    oil: '#2dd4bf',      // teal-400
    cash: '#b9ff3b',     // neon lime (replaces orange accents)
    lav: '#c084fc',      // purple-400
    grid: 'rgba(45, 212, 191, 0.15)',
    text: '#94a3b8',
    surface: '#1a2332',
    border: 'rgba(45, 212, 191, 0.25)',
  },
  mapPalette: {
    gridColor: '#2dd4bf',
    gridOpacity: 0.15,
    selectedStroke: '#b9ff3b',
    glowColor: '#b9ff3b',
    unassignedFill: '#5eead4',
    lassoFill: 'rgba(185, 255, 59, 0.12)',
    lassoStroke: '#b9ff3b',
    lassoDash: '6, 3',
  },
  features: {
    retroGrid: false,
    brandFont: false,
    glowEffects: true,
  },
  BackgroundComponent: TropicalBackground,
  atmosphereClass: 'theme-atmo',
  headerAtmosphereClass: 'theme-atmo-header',
  atmosphericOverlays: ['theme-atmo-bands', 'theme-atmo-canopy', 'theme-atmo-horizon', 'theme-atmo-ridges', 'theme-atmo-palms'],
  fxTheme: true,
};

const league: ThemeMeta = {
  id: 'league',
  variant: 'dark',
  label: 'Nocturne',
  icon: '🌙',
  description: 'Moonlit alpine palette',
  appName: 'SLOPCAST',
  appSubtitle: 'Night Operations',
  chartPalette: {
    oil: '#e9b067',
    cash: '#67c3ee',
    lav: '#8ba6d3',
    grid: 'rgba(89, 115, 157, 0.28)',
    text: '#9aaecf',
    surface: '#0b1424',
    border: 'rgba(95, 125, 170, 0.42)',
  },
  mapPalette: {
    gridColor: '#2f476d',
    gridOpacity: 0.36,
    selectedStroke: '#f4d2a4',
    glowColor: '#67c3ee',
    unassignedFill: '#44638f',
    lassoFill: 'rgba(233, 176, 103, 0.15)',
    lassoStroke: '#e9b067',
    lassoDash: '5, 3',
  },
  features: {
    retroGrid: false,
    brandFont: false,
    glowEffects: true,
  },
  BackgroundComponent: MoonlightBackground,
  atmosphereClass: 'theme-atmo',
  headerAtmosphereClass: 'theme-atmo-header',
  atmosphericOverlays: ['theme-atmo-bands', 'theme-atmo-ridges'],
};

const stormwatch: ThemeMeta = {
  id: 'stormwatch',
  variant: 'dark',
  label: 'Stormwatch',
  icon: '⛈️',
  description: 'Moody dusk storm atmosphere',
  appName: 'SLOPCAST',
  appSubtitle: 'Storm Signal',
  chartPalette: {
    oil: '#f2a65a',
    cash: '#9bc4ff',
    lav: '#c7d8ff',
    grid: 'rgba(116, 144, 191, 0.26)',
    text: '#9fb1d3',
    surface: '#101a2d',
    border: 'rgba(90, 115, 154, 0.46)',
  },
  mapPalette: {
    gridColor: '#36547f',
    gridOpacity: 0.34,
    selectedStroke: '#ffd9a0',
    glowColor: '#9bc4ff',
    unassignedFill: '#4e6e9f',
    lassoFill: 'rgba(242, 166, 90, 0.14)',
    lassoStroke: '#f2a65a',
    lassoDash: '6, 3',
  },
  features: {
    retroGrid: false,
    brandFont: false,
    glowEffects: true,
  },
  BackgroundComponent: StormDuskBackground,
  atmosphereClass: 'theme-atmo',
  headerAtmosphereClass: 'theme-atmo-header',
  atmosphericOverlays: ['theme-atmo-bands', 'theme-atmo-horizon', 'theme-atmo-ridges'],
  fxTheme: true,
};

const mario: ThemeMeta = {
  id: 'mario',
  variant: 'dark',
  label: 'Classic',
  icon: '🧱',
  description: 'Slopcast Classic — beveled retro dashboard',
  appName: 'SLOPCAST',
  appSubtitle: '1-ECONOMICS',
  chartPalette: {
    oil: '#FF2A2A',                 // production line (classic red)
    cash: '#FF2A2A',                // recovery line / fill
    lav: '#BDBDBD',                 // secondary bars / accents
    grid: 'rgba(255, 255, 255, 0.10)',
    text: 'rgba(255, 255, 255, 0.75)',
    surface: '#101010',             // tooltip bg
    border: 'rgba(255, 255, 255, 0.18)',
  },
  mapPalette: {
    gridColor: '#2C2C2C',
    gridOpacity: 0.35,
    selectedStroke: '#FFFFFF',
    glowColor: '#1270FF',
    unassignedFill: '#3b82f6',
    lassoFill: 'rgba(255, 213, 0, 0.10)',
    lassoStroke: '#FFD500',
    lassoDash: '0',
  },
  features: {
    retroGrid: false,
    brandFont: false,
    glowEffects: false,
  },
  BackgroundComponent: MarioOverworldBackground,
  atmosphereClass: 'theme-atmo',
  headerAtmosphereClass: 'theme-atmo-header',
  atmosphericOverlays: ['theme-atmo-bands', 'theme-atmo-horizon', 'theme-atmo-ridges'],
  fxTheme: true,
};

const hyperborea: ThemeMeta = {
  id: 'hyperborea',
  variant: 'dark',
  label: 'Hyperborea',
  icon: '❄️',
  description: 'Winter village frost',
  appName: 'SLOPCAST',
  appSubtitle: 'Arctic Operations',
  chartPalette: {
    oil: '#38BDF8',
    cash: '#FBBC05',
    lav: '#CBD5E1',
    grid: 'rgba(90, 108, 135, 0.25)',
    text: '#94A3B8',
    surface: '#141D2E',
    border: 'rgba(90, 108, 135, 0.4)',
  },
  mapPalette: {
    gridColor: '#5A6C87',
    gridOpacity: 0.3,
    selectedStroke: '#38BDF8',
    glowColor: '#38BDF8',
    unassignedFill: '#2C4365',
    lassoFill: 'rgba(251, 188, 5, 0.15)',
    lassoStroke: '#FBBC05',
    lassoDash: '6, 3',
  },
  features: {
    retroGrid: false,
    brandFont: false,
    glowEffects: true,
  },
  BackgroundComponent: HyperboreaBackground,
  atmosphereClass: 'theme-atmo',
  headerAtmosphereClass: 'theme-atmo-header',
  atmosphericOverlays: ['theme-atmo-bands', 'theme-atmo-horizon', 'theme-atmo-ridges'],
  fxTheme: true,
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const THEMES: ThemeMeta[] = [slate, synthwave, tropical, league, stormwatch, mario, hyperborea];

export const DEFAULT_THEME: ThemeId = 'slate';

export function getTheme(id: ThemeId): ThemeMeta {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}
