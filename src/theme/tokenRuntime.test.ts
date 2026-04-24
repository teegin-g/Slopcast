import { describe, expect, it } from 'vitest';
import { applyThemeTokens, clearThemeTokens, resolveThemeTokens, toCssVars } from './tokenRuntime';
import type { ThemeDefinition, ThemeTokenMap } from './types';

describe('theme token runtime', () => {
  it('converts typed token maps to CSS custom properties', () => {
    const tokens: ThemeTokenMap = {
      color: {
        bgDeep: '#020617',
        surface1: 'rgba(15, 23, 42, 0.88)',
      },
      radius: {
        panel: '18px',
      },
    };

    expect(toCssVars(tokens)).toEqual({
      '--bg-deep': '#020617',
      '--surface-1': 'rgba(15, 23, 42, 0.88)',
      '--radius-panel': '18px',
    });
  });

  it('applies CSS custom properties to an element', () => {
    const element = document.createElement('section');

    applyThemeTokens(element, {
      color: {
        cyan: '#38bdf8',
      },
      typography: {
        fontBrand: '"Orbitron", sans-serif',
      },
    });

    expect(element.style.getPropertyValue('--cyan')).toBe('#38bdf8');
    expect(element.style.getPropertyValue('--font-brand')).toBe('"Orbitron", sans-serif');
  });

  it('resolves mode-aware token maps with dark fallback', () => {
    const theme = {
      tokens: {
        dark: {
          color: {
            bgDeep: '10 31 24',
          },
        },
        light: {
          color: {
            bgDeep: '188 218 196',
          },
        },
      },
    } as ThemeDefinition;

    expect(resolveThemeTokens(theme, 'light')?.color?.bgDeep).toBe('188 218 196');
    expect(resolveThemeTokens(theme, 'dark')?.color?.bgDeep).toBe('10 31 24');
  });

  it('clears only runtime-managed CSS custom properties', () => {
    const element = document.createElement('section');
    element.style.setProperty('--bg-deep', '10 31 24');
    element.style.setProperty('--cyan', '0 232 144');
    element.style.setProperty('--unmanaged-token', 'keep-me');

    clearThemeTokens(element);

    expect(element.style.getPropertyValue('--bg-deep')).toBe('');
    expect(element.style.getPropertyValue('--cyan')).toBe('');
    expect(element.style.getPropertyValue('--unmanaged-token')).toBe('keep-me');
  });
});
