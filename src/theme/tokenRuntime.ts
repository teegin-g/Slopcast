import type { ThemeDefinition, ThemeTokenDefinition, ThemeTokenMap, ThemeVariant } from './types';

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

const APPLIED_TOKEN_ATTRIBUTE = 'data-theme-runtime-tokens';

const MANAGED_TOKEN_NAMES = new Set(
  Object.values(TOKEN_VAR_NAMES).flatMap(group => Object.values(group)),
);

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

function isModeAwareTokens(tokens: ThemeTokenDefinition): tokens is Partial<Record<ThemeVariant, ThemeTokenMap>> {
  return 'dark' in tokens || 'light' in tokens;
}

export function resolveThemeTokens(theme: ThemeDefinition, mode: ThemeVariant): ThemeTokenMap | undefined {
  if (!theme.tokens) return undefined;
  if (!isModeAwareTokens(theme.tokens)) return theme.tokens;

  return theme.tokens[mode] ?? theme.tokens.dark ?? theme.tokens.light;
}

export function clearThemeTokens(element: HTMLElement): void {
  const previous = element.getAttribute(APPLIED_TOKEN_ATTRIBUTE);
  const previousNames = previous?.split(' ').filter(Boolean) ?? [];

  for (const name of new Set([...MANAGED_TOKEN_NAMES, ...previousNames])) {
    element.style.removeProperty(name);
  }

  element.removeAttribute(APPLIED_TOKEN_ATTRIBUTE);
}

export function applyThemeTokens(element: HTMLElement, tokens: ThemeTokenMap): void {
  clearThemeTokens(element);
  const cssVars = toCssVars(tokens);

  for (const [name, value] of Object.entries(cssVars)) {
    element.style.setProperty(name, value);
  }

  element.setAttribute(APPLIED_TOKEN_ATTRIBUTE, Object.keys(cssVars).join(' '));
}
