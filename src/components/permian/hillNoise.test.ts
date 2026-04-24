import { describe, it, expect } from 'vitest';
import {
  hillY,
  RIDGE_LAYERS,
  PUMPJACK_SLOTS,
  pumpjackGroundY,
  getRidge,
  HILL_NOISE_GLSL,
} from './hillNoise';

describe('hillY', () => {
  it('matches reference values at sampled points', () => {
    // Spot-checks computed from the reference formula. These lock the shape
    // of the ridges — if someone tweaks hillY, pumpjacks (which placement uses
    // the same function) will float.
    const seed = 1.0;
    const amp = 0.022;
    expect(hillY(seed, 0, amp)).toBeCloseTo(-0.022 * Math.sin(seed)
      - 0.022 * 0.55 * Math.sin(seed * 1.6)
      - 0.022 * 0.3 * Math.sin(seed * 0.6), 10);
    expect(hillY(seed, 0.5, amp)).toBeCloseTo(
      -Math.sin(80 * 0.04 + seed) * amp
      - Math.sin(80 * 0.08 + seed * 1.6) * amp * 0.55
      - Math.sin(80 * 0.15 + seed * 0.6) * amp * 0.3,
      10,
    );
  });

  it('is bounded by roughly the amplitude envelope', () => {
    const amp = 0.028;
    // Envelope: 1 + 0.55 + 0.3 = 1.85, but peaks rarely align.
    for (let x = 0; x <= 1; x += 0.05) {
      const y = hillY(2.4, x, amp);
      expect(Math.abs(y)).toBeLessThan(amp * 2);
    }
  });

  it('is deterministic', () => {
    expect(hillY(5.5, 0.33, 0.018)).toEqual(hillY(5.5, 0.33, 0.018));
  });
});

describe('RIDGE_LAYERS', () => {
  it('has four named layers in far→close order', () => {
    expect(RIDGE_LAYERS.map(r => r.name)).toEqual(['far', 'mid', 'near', 'close']);
    for (let i = 1; i < RIDGE_LAYERS.length; i++) {
      expect(RIDGE_LAYERS[i].y).toBeGreaterThan(RIDGE_LAYERS[i - 1].y);
    }
  });
});

describe('PUMPJACK_SLOTS', () => {
  it('every slot targets a valid ridge', () => {
    for (const slot of PUMPJACK_SLOTS) {
      expect(() => getRidge(slot.ridge)).not.toThrow();
    }
  });

  it('pumpjackGroundY lies in a reasonable viewport range', () => {
    for (const slot of PUMPJACK_SLOTS) {
      const y = pumpjackGroundY(slot);
      expect(y).toBeGreaterThan(0.4);
      expect(y).toBeLessThan(0.75);
    }
  });
});

describe('HILL_NOISE_GLSL', () => {
  it('includes the exact three-term formulation used by hillY', () => {
    expect(HILL_NOISE_GLSL).toContain('0.04');
    expect(HILL_NOISE_GLSL).toContain('0.08');
    expect(HILL_NOISE_GLSL).toContain('0.15');
    expect(HILL_NOISE_GLSL).toContain('0.55');
    expect(HILL_NOISE_GLSL).toContain('0.3');
    expect(HILL_NOISE_GLSL).toContain('1.6');
    expect(HILL_NOISE_GLSL).toContain('0.6');
  });
});
