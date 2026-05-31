/**
 * Shared class-string builders for the economics control panels
 * (Capex / Opex / Ownership / DeclineSegment).
 *
 * These strings were previously duplicated verbatim inside each control file.
 * They are intentionally byte-identical to those originals for BOTH isClassic
 * modes so that extracting them into this hook produces ZERO visual regression.
 */
export interface ControlsStyles {
  /** Header + footer chrome (border + background) — used on the grid header row and add-footer. */
  headerClass: string;
  /** Inline read/value text for numeric grid cells. */
  inlineValueClass: string;
  /** Inline edit input for grid cells. */
  inlineInputClass: string;
  /** Outer table wrapper border + background. */
  wrapperClass: string;
}

export function useControlsStyles(isClassic: boolean): ControlsStyles {
  const headerClass = isClassic
    ? 'bg-black/10 border-black/30'
    : 'bg-theme-bg border-theme-border';

  const inlineValueClass = isClassic
    ? 'text-[10px] font-black text-white'
    : 'text-[10px] font-mono text-theme-text';

  const inlineInputClass = 'text-[10px] w-full';

  const wrapperClass = isClassic
    ? 'border-black/30 bg-black/10'
    : 'border-theme-border bg-theme-bg';

  return { headerClass, inlineValueClass, inlineInputClass, wrapperClass };
}
