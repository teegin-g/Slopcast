import type { ThemeTokenMap } from './types';

const TOKEN_VAR_NAMES: Record<string, Record<string, string>> = {
  color: {
    bgDeep: '--bg-deep',
    bgSpace: '--bg-space',
    surface1: '--surface-1',
    surface2: '--surface-2',
    border: '--border',
    cyan: '--cyan',
    magenta: '--magenta',
    lav: '--lav',
  },
  radius: {
    panel: '--radius-panel',
    inner: '--radius-inner',
  },
  typography: {
    fontSans: '--font-sans',
    fontHeading: '--font-heading',
    fontBrand: '--font-brand',
    fontScript: '--font-script',
  },
};

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
}

function tokenToCssVar(group: string, key: string): string {
  return TOKEN_VAR_NAMES[group]?.[key] ?? `--${toKebabCase(key)}`;
}

export function toCssVars(tokens: ThemeTokenMap): Record<string, string> {
  const cssVars: Record<string, string> = {};

  for (const [group, values] of Object.entries(tokens) as Array<[string, Record<string, string> | undefined]>) {
    if (!values) continue;

    for (const [key, value] of Object.entries(values)) {
      cssVars[tokenToCssVar(group, key)] = value;
    }
  }

  return cssVars;
}

export function applyThemeTokens(element: HTMLElement, tokens: ThemeTokenMap): void {
  const cssVars = toCssVars(tokens);

  for (const [name, value] of Object.entries(cssVars)) {
    element.style.setProperty(name, value);
  }
}
