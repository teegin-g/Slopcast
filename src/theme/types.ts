import type React from 'react';

export type KnownThemeId =
  | 'slate'
  | 'synthwave'
  | 'tropical'
  | 'league'
  | 'stormwatch'
  | 'mario'
  | 'hyperborea'
  | 'permian';

export type ThemeId = KnownThemeId | (string & {});

export type ColorMode = 'dark' | 'light' | 'system';

export type ThemeVariant = 'dark' | 'light';

export type PanelStyle = 'glass' | 'solid' | 'outline';

export type ThemeRendererKind = 'none' | 'css' | 'svg' | 'canvas2d' | 'r3f';

export interface ThemeIconDefinition {
  kind: 'svg' | 'emoji';
  component?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  value?: string;
  fallback: string;
  label: string;
}

export interface ThemePreview {
  swatch: string;
  accent: string;
  surface: string;
  shortLabel: string;
  tagline: string;
}

export interface ThemeChrome {
  density: 'comfortable' | 'compact' | 'dense';
  panelStyle: PanelStyle;
  radius: 'sharp' | 'soft' | 'round' | 'custom';
  brandTreatment: 'wordmark' | 'badge' | 'classic-cartridge' | 'cinematic';
  navTreatment: 'tabs' | 'pills' | 'classic-buttons';
}

export interface ThemeSceneRuntimeProps {
  themeId: ThemeId;
  effectiveMode: ThemeVariant;
  fxMode: 'clear' | 'cinematic' | 'max';
  reducedMotion: boolean;
  paused: boolean;
  deviceTier: 'low' | 'standard' | 'high';
}

export interface ThemeSceneConfig {
  renderer: ThemeRendererKind;
  component?: React.ComponentType;
  fallbackComponent?: React.ComponentType;
  supportsFx: boolean;
  requiresWebGL: boolean;
  hasFallback: boolean;
  pauseWhenHidden: boolean;
  respectsReducedMotion: boolean;
}

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

/** Mapbox GL style overrides per theme. */
export interface MapboxOverrides {
  bgColor: string;
  waterColor: string;
  landColor: string;
  labelColor: string;
  roadOpacity: number;
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
  mapboxOverrides?: MapboxOverrides;
}

/** Optional per-theme visual features. */
export interface ThemeFeatures {
  retroGrid: boolean;
  brandFont: boolean;
  glowEffects: boolean;
  panelStyle: PanelStyle;
  headingFont: boolean;
  denseSpacing: boolean;
  /** Mario/Classic theme: use sc-panel/sc-* CSS classes instead of theme tokens */
  isClassicTheme: boolean;
}

export interface ThemeTokens {
  color?: Record<string, string>;
  radius?: Record<string, string>;
  typography?: Record<string, string>;
  spacing?: Record<string, string>;
  surface?: Record<string, string>;
  motion?: Record<string, string>;
}

export type ThemeTokenMap = ThemeTokens;

export type ThemeModeTokenMap = Partial<Record<ThemeVariant, ThemeTokenMap>>;

export type ThemeTokenDefinition = ThemeTokenMap | ThemeModeTokenMap;

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  icon: string;
  description: string;
  appName: string;
  appSubtitle: string;
  chartPalette: ChartPalette;
  mapPalette: MapPalette;
  features: ThemeFeatures;
  /** Default variant for this theme */
  variant: ThemeVariant;
  /** Whether this theme has a light mode variant */
  hasLightVariant?: boolean;
  /** Selector-facing visual metadata. */
  preview?: ThemePreview;
  /** Authored icon metadata; legacy emoji `icon` remains the fallback. */
  iconDefinition?: ThemeIconDefinition;
  /** Theme chrome traits for selectors, headers, and future shell migration. */
  chrome?: ThemeChrome;
  /** Scene renderer metadata for background migration. */
  scene?: ThemeSceneConfig;
  /** Runtime CSS variables for future theme wiring. */
  tokens?: ThemeTokenDefinition;
  /** Optional animated background component for this theme */
  BackgroundComponent?: React.ComponentType;
  /** CSS class names for atmospheric overlay divs rendered in the header */
  atmosphericOverlays?: string[];
  /** CSS class applied to the header for atmospheric effects */
  headerAtmosphereClass?: string;
  /** CSS class applied to the page wrapper for atmospheric effects */
  atmosphereClass?: string;
  /** CSS class names for page-level overlays rendered by the shell */
  pageOverlayClasses?: string[];
  /** Whether this theme supports fx modes (cinematic/max) */
  fxTheme?: boolean;
}

export type ThemeMeta = ThemeDefinition;

export interface UiThemeCase {
  id: ThemeId;
  title: string;
  colorMode?: Exclude<ColorMode, 'system'>;
  /** Stable alias for screenshot paths when a theme id covers multiple modes. */
  alias?: string;
}
