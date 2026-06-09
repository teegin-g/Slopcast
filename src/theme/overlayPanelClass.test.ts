import { describe, it, expect } from 'vitest';
import { overlayPanelClass } from './registry';

/**
 * Overlay panels float over the Mapbox canvas. A full-strength `--border`
 * over the dark map reads as a bright "white outline" (the reported bug),
 * and a flat translucent surface lacks depth. Panels should instead read as
 * intentional floating cards: a softened (alpha) border plus a shadow for
 * separation, consistent with the sidebar/toolbar surfaces.
 */
describe('overlayPanelClass', () => {
  const styles = ['glass', 'solid', 'outline'] as const;

  it('returns a non-empty class for every panel style', () => {
    for (const s of styles) expect(overlayPanelClass(s).length).toBeGreaterThan(0);
  });

  it('grounds every panel with a shadow for depth', () => {
    for (const s of styles) expect(overlayPanelClass(s)).toMatch(/shadow/);
  });

  it('softens the border with an alpha instead of a full-strength outline', () => {
    for (const s of styles) expect(overlayPanelClass(s)).toMatch(/border-\[var\(--border\)\]\/\d/);
  });

  it('keeps the frosted blur on the glass style', () => {
    expect(overlayPanelClass('glass')).toMatch(/backdrop-blur/);
  });
});
