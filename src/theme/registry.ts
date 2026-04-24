import type { ThemeDefinition, ThemeFeatures, ThemeId, UiThemeCase } from './types';
import {
  HyperboreaBackground,
  MarioOverworldBackground,
  MoonlightBackground,
  PermianBackground,
  StormDuskBackground,
  SynthwaveBackground,
  TropicalBackground,
} from './backgrounds';

const slate: ThemeDefinition = {
  id: 'slate',
  variant: 'dark',
  hasLightVariant: true,
  label: 'Slate',
  icon: '🏢',
  description: 'Corporate blue-gray',
  appName: 'SLOPCAST',
  appSubtitle: 'Deal Intelligence',
  chartPalette: {
    oil: '#3b82f6',
    cash: '#10b981',
    lav: '#8b5cf6',
    grid: '#373b44',
    text: '#9ca0aa',
    surface: '#12141b',
    border: '#52565f',
  },
  mapPalette: {
    gridColor: '#23262f',
    gridOpacity: 0.3,
    selectedStroke: '#ffffff',
    glowColor: '#3b82f6',
    unassignedFill: '#52565f',
    lassoFill: 'rgba(59, 130, 246, 0.1)',
    lassoStroke: '#3b82f6',
    lassoDash: '4',
    mapboxOverrides: { bgColor: '#12141b', waterColor: '#1c1f26', landColor: '#23262f', labelColor: '#9ca0aa', roadOpacity: 0.15 },
  },
  features: {
    retroGrid: false,
    brandFont: false,
    glowEffects: false,
    panelStyle: 'solid',
    headingFont: false,
    denseSpacing: false,
    isClassicTheme: false,
  },
};

const synthwave: ThemeDefinition = {
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
    mapboxOverrides: { bgColor: '#0a0015', waterColor: '#120825', landColor: '#0E061A', labelColor: '#6053A0', roadOpacity: 0.08 },
  },
  features: {
    retroGrid: true,
    brandFont: true,
    glowEffects: true,
    panelStyle: 'outline',
    headingFont: false,
    denseSpacing: false,
    isClassicTheme: false,
  },
  BackgroundComponent: SynthwaveBackground,
  atmosphereClass: 'theme-atmo',
  headerAtmosphereClass: 'theme-atmo-header',
  atmosphericOverlays: ['theme-atmo-bands', 'theme-atmo-horizon', 'theme-atmo-ridges'],
  fxTheme: true,
};

const tropical: ThemeDefinition = {
  id: 'tropical',
  variant: 'dark',
  label: 'Tropical',
  icon: '🌴',
  description: 'Tommy Bahama resort',
  appName: 'SLOPCAST',
  appSubtitle: 'Island Economics',
  chartPalette: {
    oil: '#2dd4bf',
    cash: '#B9FF3B',
    lav: '#c084fc',
    grid: 'rgba(45, 212, 191, 0.15)',
    text: '#94a3b8',
    surface: '#1a2332',
    border: 'rgba(45, 212, 191, 0.25)',
  },
  mapPalette: {
    gridColor: '#2dd4bf',
    gridOpacity: 0.15,
    selectedStroke: '#FF7F6B',
    glowColor: '#FF7F6B',
    unassignedFill: '#5eead4',
    lassoFill: 'rgba(255, 127, 107, 0.12)',
    lassoStroke: '#FF7F6B',
    lassoDash: '6, 3',
    mapboxOverrides: { bgColor: '#0a1520', waterColor: '#0d2030', landColor: '#1a2332', labelColor: '#5eead4', roadOpacity: 0.10 },
  },
  features: {
    retroGrid: false,
    brandFont: false,
    glowEffects: true,
    panelStyle: 'glass',
    headingFont: true,
    denseSpacing: false,
    isClassicTheme: false,
  },
  BackgroundComponent: TropicalBackground,
  atmosphereClass: 'theme-atmo',
  headerAtmosphereClass: 'theme-atmo-header',
  atmosphericOverlays: ['theme-atmo-bands', 'theme-atmo-canopy', 'theme-atmo-horizon', 'theme-atmo-ridges', 'theme-atmo-palms'],
  fxTheme: true,
};

const league: ThemeDefinition = {
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
    glowColor: '#e9b067',
    unassignedFill: '#44638f',
    lassoFill: 'rgba(233, 176, 103, 0.15)',
    lassoStroke: '#e9b067',
    lassoDash: '5, 3',
    mapboxOverrides: { bgColor: '#0b1424', waterColor: '#0f1c35', landColor: '#122040', labelColor: '#44638f', roadOpacity: 0.10 },
  },
  features: {
    retroGrid: false,
    brandFont: false,
    glowEffects: true,
    panelStyle: 'outline',
    headingFont: true,
    denseSpacing: false,
    isClassicTheme: false,
  },
  BackgroundComponent: MoonlightBackground,
  atmosphereClass: 'theme-atmo',
  headerAtmosphereClass: 'theme-atmo-header',
  atmosphericOverlays: ['theme-atmo-bands', 'theme-atmo-ridges'],
};

const stormwatch: ThemeDefinition = {
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
    mapboxOverrides: { bgColor: '#101a2d', waterColor: '#152540', landColor: '#1a2a45', labelColor: '#4e6e9f', roadOpacity: 0.12 },
  },
  features: {
    retroGrid: false,
    brandFont: false,
    glowEffects: true,
    panelStyle: 'solid',
    headingFont: true,
    denseSpacing: true,
    isClassicTheme: false,
  },
  BackgroundComponent: StormDuskBackground,
  atmosphereClass: 'theme-atmo',
  headerAtmosphereClass: 'theme-atmo-header',
  atmosphericOverlays: ['theme-atmo-bands', 'theme-atmo-horizon', 'theme-atmo-ridges'],
  fxTheme: true,
};

const mario: ThemeDefinition = {
  id: 'mario',
  variant: 'dark',
  label: 'Classic',
  icon: '🧱',
  description: 'Slopcast Classic — beveled retro dashboard',
  appName: 'SLOPCAST',
  appSubtitle: '1-ECONOMICS',
  chartPalette: {
    oil: '#FF2A2A',
    cash: '#4CAF50',
    lav: '#BDBDBD',
    grid: 'rgba(255, 255, 255, 0.10)',
    text: 'rgba(255, 255, 255, 0.75)',
    surface: '#101010',
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
    mapboxOverrides: { bgColor: '#101010', waterColor: '#1a1a2e', landColor: '#181818', labelColor: '#666666', roadOpacity: 0.12 },
  },
  features: {
    retroGrid: false,
    brandFont: false,
    glowEffects: false,
    panelStyle: 'glass',
    headingFont: false,
    denseSpacing: false,
    isClassicTheme: true,
  },
  BackgroundComponent: MarioOverworldBackground,
  atmosphereClass: 'theme-atmo',
  headerAtmosphereClass: 'theme-atmo-header',
  atmosphericOverlays: ['theme-atmo-bands', 'theme-atmo-horizon', 'theme-atmo-ridges'],
  fxTheme: true,
};

const hyperborea: ThemeDefinition = {
  id: 'hyperborea',
  variant: 'dark',
  label: 'Hyperborea',
  icon: '❄️',
  description: 'Winter village frost',
  appName: 'SLOPCAST',
  appSubtitle: 'Arctic Operations',
  chartPalette: {
    oil: '#38BDF8',
    cash: '#7DD3FC',
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
    lassoFill: 'rgba(125, 211, 252, 0.15)',
    lassoStroke: '#7DD3FC',
    lassoDash: '6, 3',
    mapboxOverrides: { bgColor: '#0a1525', waterColor: '#0f1d35', landColor: '#141D2E', labelColor: '#5A6C87', roadOpacity: 0.10 },
  },
  features: {
    retroGrid: false,
    brandFont: false,
    glowEffects: true,
    panelStyle: 'glass',
    headingFont: true,
    denseSpacing: false,
    isClassicTheme: false,
  },
  BackgroundComponent: HyperboreaBackground,
  atmosphereClass: 'theme-atmo',
  headerAtmosphereClass: 'theme-atmo-header',
  atmosphericOverlays: ['theme-atmo-bands', 'theme-atmo-horizon', 'theme-atmo-ridges'],
  pageOverlayClasses: ['theme-aurora'],
  fxTheme: true,
};

const permian: ThemeDefinition = {
  id: 'permian',
  variant: 'dark',
  hasLightVariant: true,
  label: 'Permian',
  icon: '🛢️',
  description: 'Oilpatch dusk-to-noon',
  appName: 'SLOPCAST',
  appSubtitle: 'Patch Economics',
  chartPalette: {
    oil: '#E87030',
    cash: '#00E890',
    lav: '#F0C020',
    grid: 'rgba(0, 232, 144, 0.14)',
    text: '#9AA99A',
    surface: '#0A1F18',
    border: 'rgba(45, 107, 74, 0.42)',
  },
  mapPalette: {
    gridColor: '#2D6B4A',
    gridOpacity: 0.32,
    selectedStroke: '#E87030',
    glowColor: '#00E890',
    unassignedFill: '#556070',
    lassoFill: 'rgba(240, 192, 32, 0.14)',
    lassoStroke: '#F0C020',
    lassoDash: '6, 3',
    mapboxOverrides: {
      bgColor: '#0A1F18',
      waterColor: '#14654A',
      landColor: '#1A3A2A',
      labelColor: '#6B8870',
      roadOpacity: 0.14,
    },
  },
  features: {
    retroGrid: false,
    brandFont: true,
    glowEffects: true,
    panelStyle: 'glass',
    headingFont: true,
    denseSpacing: false,
    isClassicTheme: false,
  },
  BackgroundComponent: PermianBackground,
  atmosphereClass: 'theme-atmo',
  headerAtmosphereClass: 'theme-atmo-header',
  atmosphericOverlays: ['theme-atmo-bands', 'theme-atmo-horizon', 'theme-atmo-ridges', 'theme-atmo-heat'],
  fxTheme: true,
};

export const THEMES: ThemeDefinition[] = [slate, synthwave, tropical, league, stormwatch, mario, hyperborea, permian];

export const DEFAULT_THEME: ThemeId = 'slate';

export function getTheme(id: ThemeId): ThemeDefinition {
  return THEMES.find(theme => theme.id === id) ?? THEMES[0];
}

export function getUiThemeCases(themes: readonly ThemeDefinition[] = THEMES): UiThemeCase[] {
  return themes.flatMap(theme => {
    const baseCase = { id: theme.id, title: theme.label };
    if (!theme.hasLightVariant) return [baseCase];

    return [
      { ...baseCase, colorMode: 'dark' as const },
      {
        ...baseCase,
        colorMode: 'light' as const,
        alias: theme.id === 'permian' ? 'permian-noon' : `${theme.id}-light`,
      },
    ];
  });
}

export function getFxThemeIds(themes: readonly ThemeDefinition[] = THEMES): ThemeId[] {
  return themes.filter(theme => theme.fxTheme).map(theme => theme.id);
}

export function overlayPanelClass(style: ThemeFeatures['panelStyle']): string {
  switch (style) {
    case 'glass':
      return 'backdrop-blur-sm bg-[var(--surface-1)]/80 border border-[var(--border)]';
    case 'solid':
      return 'bg-[var(--surface-1)] border border-[var(--border)]';
    case 'outline':
      return 'bg-[var(--surface-1)]/20 border border-[var(--border)]/60';
  }
}
