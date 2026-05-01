import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  getFxThemeIds,
  getTheme,
  getThemeChrome,
  getThemeIcon,
  getThemePreview,
  getThemeScene,
  getUiThemeCases,
  overlayPanelClass,
  THEMES,
} from './registry';

describe('theme registry metadata helpers', () => {
  it('exposes selector preview metadata for every registered theme', () => {
    for (const theme of THEMES) {
      const preview = getThemePreview(theme);

      expect(preview.shortLabel).toBeTruthy();
      expect(preview.tagline).toBeTruthy();
      expect(preview.swatch).toContain('gradient');
      expect(preview.accent).toBeTruthy();
      expect(preview.surface).toBeTruthy();
    }
  });

  it('exposes SVG icons with emoji fallback preserved', () => {
    for (const theme of THEMES) {
      const icon = getThemeIcon(theme);

      expect(icon.kind).toBe('svg');
      expect(icon.fallback).toBe(theme.icon);
      expect(icon.label).toBe(theme.label);
    }
  });

  it('exposes chrome and scene metadata derived from the theme contract', () => {
    for (const theme of THEMES) {
      const chrome = getThemeChrome(theme);
      const scene = getThemeScene(theme);

      expect(chrome.panelStyle).toBe(theme.features.panelStyle);
      expect(scene.supportsFx).toBe(Boolean(theme.fxTheme));
      expect(scene.respectsReducedMotion).toBe(true);
      expect(['none', 'css', 'svg', 'canvas2d', 'r3f']).toContain(scene.renderer);
    }
  });

  it('keeps UI screenshot cases based on registered metadata', () => {
    const cases = getUiThemeCases();

    expect(cases.map(themeCase => themeCase.alias ?? themeCase.id)).toContain('permian-noon');
    expect(cases.map(themeCase => themeCase.id)).toContain('mario');
  });
});

describe('theme registry', () => {
  it('keeps slate as the default theme id', () => {
    expect(DEFAULT_THEME).toBe('slate');
    expect(getTheme(DEFAULT_THEME).id).toBe('slate');
  });

  it('preserves the existing theme ids in order', () => {
    expect(THEMES.map(theme => theme.id)).toEqual([
      'slate',
      'synthwave',
      'tropical',
      'league',
      'stormwatch',
      'mario',
      'hyperborea',
      'permian',
    ]);
  });

  it('falls back to the first registered theme for unknown ids', () => {
    expect(getTheme('unknown-theme').id).toBe('slate');
  });

  it('marks the mario theme as the classic theme', () => {
    expect(getTheme('mario').features.isClassicTheme).toBe(true);
  });

  it('keeps Permian light variant support enabled', () => {
    expect(getTheme('permian').hasLightVariant).toBe(true);
  });

  it('declares Hyperborea page overlay classes in the registry', () => {
    expect(getTheme('hyperborea').pageOverlayClasses).toEqual(['theme-aurora']);
  });

  it('defaults themes without page overlays to no classes', () => {
    for (const theme of THEMES.filter(theme => theme.id !== 'hyperborea')) {
      expect(theme.pageOverlayClasses ?? []).toEqual([]);
    }
  });

  it('derives UI theme cases from registered themes', () => {
    expect(getUiThemeCases().map(theme => theme.id)).toEqual([
      'slate',
      'slate',
      'synthwave',
      'tropical',
      'league',
      'stormwatch',
      'mario',
      'hyperborea',
      'permian',
      'permian',
    ]);
  });

  it('adds stable aliases for light UI theme cases', () => {
    expect(getUiThemeCases()).toContainEqual({
      id: 'slate',
      title: 'Slate',
      colorMode: 'light',
      alias: 'slate-light',
    });
    expect(getUiThemeCases()).toContainEqual({
      id: 'permian',
      title: 'Permian',
      colorMode: 'light',
      alias: 'permian-noon',
    });
  });

  it('derives fx theme ids from registered themes', () => {
    expect(getFxThemeIds()).toEqual(['synthwave', 'tropical', 'stormwatch', 'mario', 'hyperborea', 'permian']);
  });

  it('returns the existing overlay panel class names', () => {
    expect(overlayPanelClass('glass')).toBe('backdrop-blur-sm bg-[var(--surface-1)]/80 border border-[var(--border)]');
    expect(overlayPanelClass('solid')).toBe('bg-[var(--surface-1)] border border-[var(--border)]');
    expect(overlayPanelClass('outline')).toBe('bg-[var(--surface-1)]/20 border border-[var(--border)]/60');
  });
});
