import type { ThemeId } from '../../../theme/themes';

export type MapOverlayTone = 'bar' | 'card' | 'rail';

function themeTone(themeId: ThemeId): string {
  if (themeId === 'slate') return 'slate';
  if (themeId === 'tropical') return 'tropical';
  if (themeId === 'permian') return 'permian';
  if (themeId === 'synthwave') return 'synthwave';
  if (themeId === 'stormwatch') return 'stormwatch';
  if (themeId === 'hyperborea') return 'hyperborea';
  if (themeId === 'league') return 'league';
  return 'default';
}

export function mapOverlayPanelClass(isClassic: boolean, themeId: ThemeId, tone: MapOverlayTone): string {
  if (isClassic) return 'sc-panel theme-transition';
  return `map-overlay-panel map-overlay-panel--${tone} map-overlay-panel--${themeTone(themeId)} theme-transition`;
}

export function mapOverlayControlClass(isClassic: boolean, active = false): string {
  if (isClassic) {
    return active
      ? 'sc-btnPrimary'
      : 'text-white/70 hover:text-white hover:bg-white/10';
  }
  return `map-overlay-control ${active ? 'is-active' : ''}`;
}

export function mapOverlayMenuClass(isClassic: boolean, themeId: ThemeId): string {
  if (isClassic) return 'rounded-inner bg-[#1a1a2e] border border-white/20 shadow-lg';
  return `map-overlay-menu map-overlay-panel--${themeTone(themeId)}`;
}

export function mapOverlayDividerClass(isClassic: boolean): string {
  return isClassic ? 'bg-white/20' : 'map-overlay-divider';
}
