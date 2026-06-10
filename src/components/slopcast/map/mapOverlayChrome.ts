/**
 * Shared base class for square map-overlay icon buttons (tool rail + layers
 * control). Pair with `mapOverlayControlClass(isClassic, active)` for theming.
 */
export const mapOverlayIconButtonClass =
  'w-11 h-11 rounded-lg flex shrink-0 items-center justify-center touch-manipulation transition-colors';

export function mapOverlayControlClass(isClassic: boolean, active = false): string {
  if (isClassic) {
    return active
      ? 'sc-btnPrimary'
      : 'text-white/70 hover:text-white hover:bg-white/10';
  }
  return `map-overlay-control ${active ? 'is-active' : ''}`;
}

export function mapOverlayMenuClass(isClassic: boolean): string {
  if (isClassic) return 'rounded-inner bg-[#1a1a2e] border border-white/20 shadow-lg';
  return 'map-overlay-menu';
}

export function mapOverlayDividerClass(isClassic: boolean): string {
  return isClassic ? 'bg-white/20' : 'map-overlay-divider';
}
