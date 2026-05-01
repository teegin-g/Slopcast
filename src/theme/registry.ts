import { hyperborea } from './definitions/hyperborea';
import { league } from './definitions/league';
import { mario } from './definitions/mario';
import { permian } from './definitions/permian';
import { slate } from './definitions/slate';
import { stormwatch } from './definitions/stormwatch';
import { synthwave } from './definitions/synthwave';
import { tropical } from './definitions/tropical';
import type { ThemeDefinition, ThemeFeatures, ThemeId, UiThemeCase } from './types';
import type { ThemeRendererKind, ThemeSceneConfig } from './scene/types';

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

function inferLegacyRenderer(theme: ThemeDefinition): ThemeRendererKind {
  if (!theme.BackgroundComponent) return theme.atmosphereClass || theme.pageOverlayClasses?.length ? 'css' : 'none';
  if (theme.id === 'permian') return 'r3f';
  if (theme.id === 'synthwave') return 'svg';
  return 'canvas2d';
}

export function getThemeScene(theme: ThemeDefinition): ThemeSceneConfig {
  const legacyScene: ThemeSceneConfig = {
    renderer: inferLegacyRenderer(theme),
    component: theme.BackgroundComponent,
    supportsFx: !!theme.fxTheme,
    requiresWebGL: theme.id === 'permian',
    pauseWhenHidden: !!theme.BackgroundComponent,
    respectsReducedMotion: !!theme.BackgroundComponent,
    quality: theme.BackgroundComponent ? 'cinematic' : 'static',
    ownsVignette: !!theme.BackgroundComponent,
    ownsGrain: false,
    ownsAtmosphericOverlays: false,
  };

  return {
    ...legacyScene,
    ...theme.scene,
    component: theme.scene?.component ?? legacyScene.component,
    fallbackComponent: theme.scene?.fallbackComponent ?? legacyScene.fallbackComponent,
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
