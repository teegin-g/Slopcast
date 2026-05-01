import { hyperborea } from './definitions/hyperborea';
import { league } from './definitions/league';
import { mario } from './definitions/mario';
import { permian } from './definitions/permian';
import { slate } from './definitions/slate';
import { stormwatch } from './definitions/stormwatch';
import { synthwave } from './definitions/synthwave';
import { tropical } from './definitions/tropical';
import type {
  ThemeChrome,
  ThemeDefinition,
  ThemeFeatures,
  ThemeIconDefinition,
  ThemeId,
  ThemePreview,
  ThemeSceneConfig,
  UiThemeCase,
} from './types';

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

export function getThemePreview(theme: ThemeDefinition): ThemePreview {
  return theme.preview ?? {
    swatch: `linear-gradient(135deg, ${theme.chartPalette.surface} 0%, ${theme.mapPalette.unassignedFill} 58%, ${theme.chartPalette.oil} 100%)`,
    accent: theme.chartPalette.oil,
    surface: theme.chartPalette.surface,
    shortLabel: theme.label,
    tagline: theme.description,
  };
}

export function getThemeIcon(theme: ThemeDefinition): ThemeIconDefinition {
  return theme.iconDefinition ?? {
    kind: 'emoji',
    value: theme.icon,
    fallback: theme.icon,
    label: theme.label,
  };
}

export function getThemeChrome(theme: ThemeDefinition): ThemeChrome {
  return theme.chrome ?? {
    density: theme.features.denseSpacing ? 'dense' : 'comfortable',
    panelStyle: theme.features.panelStyle,
    radius: theme.features.isClassicTheme ? 'round' : 'soft',
    brandTreatment: theme.features.isClassicTheme ? 'classic-cartridge' : theme.features.brandFont ? 'cinematic' : 'wordmark',
    navTreatment: theme.features.isClassicTheme ? 'classic-buttons' : 'pills',
  };
}

export function getThemeScene(theme: ThemeDefinition): ThemeSceneConfig {
  if (theme.scene) return theme.scene;

  return {
    renderer: theme.BackgroundComponent ? 'canvas2d' : 'none',
    component: theme.BackgroundComponent,
    supportsFx: Boolean(theme.fxTheme),
    requiresWebGL: false,
    hasFallback: true,
    pauseWhenHidden: Boolean(theme.BackgroundComponent),
    respectsReducedMotion: true,
  };
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
