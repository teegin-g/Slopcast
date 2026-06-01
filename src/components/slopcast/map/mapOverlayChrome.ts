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
