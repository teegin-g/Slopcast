/**
 * probit.ts — O&G probit-plot helpers
 *
 * Provides:
 *   percentileToProbit  — inverse normal CDF (Acklam rational approximation)
 *   toProbitPoints      — convert raw values to { value, rank, z } plot points
 *   probitColor         — map a value within a domain to a CSS hsl() color
 */

// ---------------------------------------------------------------------------
// Acklam rational approximation coefficients
// Reference: Peter J. Acklam, "An algorithm for computing the inverse
//            normal cumulative distribution function"
// Accuracy: |error| < 1.15e-9 for p in (0, 1)
// ---------------------------------------------------------------------------
const A = [
  -3.969683028665376e1,
   2.209460984245205e2,
  -2.759285104469687e2,
   1.383577518672690e2,
  -3.066479806614716e1,
   2.506628277459239,
];

const B = [
  -5.447609879822406e1,
   1.615858368580409e2,
  -1.556989798598866e2,
   6.680131188771972e1,
  -1.328068155288572e1,
];

const C = [
  -7.784894002430293e-3,
  -3.223964580411365e-1,
  -2.400758277161838,
  -2.549732539343734,
   4.374664141464968,
   2.938163982698783,
];

const D = [
  7.784695709041462e-3,
  3.224671290700398e-1,
  2.445134137142996,
  3.754408661907416,
];

const P_LOW  = 0.02425;
const P_HIGH = 1 - P_LOW;

/**
 * Inverse normal CDF (probit / quantile function).
 * Maps p ∈ (0, 1) to a z-score.
 * Uses the Acklam rational approximation (accurate to ~1e-9).
 * Clamps p to [1e-9, 1-1e-9] to avoid ±Infinity at the boundaries.
 */
export function percentileToProbit(p: number): number {
  // Clamp to avoid boundary singularities
  const EPSILON = 1e-9;
  const pc = Math.max(EPSILON, Math.min(1 - EPSILON, p));

  let q: number;
  let r: number;

  if (pc < P_LOW) {
    // Lower tail
    q = Math.sqrt(-2 * Math.log(pc));
    return (
      (((((C[0] * q + C[1]) * q + C[2]) * q + C[3]) * q + C[4]) * q + C[5]) /
      ((((D[0] * q + D[1]) * q + D[2]) * q + D[3]) * q + 1)
    );
  }

  if (pc <= P_HIGH) {
    // Central region
    q = pc - 0.5;
    r = q * q;
    return (
      ((((((A[0] * r + A[1]) * r + A[2]) * r + A[3]) * r + A[4]) * r + A[5]) * q) /
      (((((B[0] * r + B[1]) * r + B[2]) * r + B[3]) * r + B[4]) * r + 1)
    );
  }

  // Upper tail (mirror of lower)
  q = Math.sqrt(-2 * Math.log(1 - pc));
  return -(
    (((((C[0] * q + C[1]) * q + C[2]) * q + C[3]) * q + C[4]) * q + C[5]) /
    ((((D[0] * q + D[1]) * q + D[2]) * q + D[3]) * q + 1)
  );
}

// ---------------------------------------------------------------------------
// Probit plot points
// ---------------------------------------------------------------------------

/** A single point on a probit plot. */
export interface ProbitPoint {
  /** The original numeric value. */
  value: number;
  /** Percentile rank in (0, 1) — Hazen / median plotting position. */
  rank: number;
  /** Normal quantile (z-score) for this rank. */
  z: number;
}

/**
 * Convert an array of numeric values into probit-plot points.
 *
 * Sorting: ascending. Plotting position: Hazen / median — rank_i = (i + 0.5) / n.
 * Ties are handled deterministically by stable sort order (equal values keep
 * their original relative order, which the sort below preserves).
 * Returns one point per input value in the ORIGINAL input order.
 *
 * @throws {Error} if any value is not a finite number (NaN or ±Infinity would
 *   produce an implementation-defined sort order via a NaN comparator result).
 *   All values must be finite numbers.
 */
export function toProbitPoints(values: number[]): ProbitPoint[] {
  if (values.some((v) => !Number.isFinite(v))) {
    throw new Error('toProbitPoints: values must all be finite numbers');
  }

  const n = values.length;
  if (n === 0) return [];

  // Build index array and stable-sort by value ascending
  const indices = values.map((_, i) => i);
  indices.sort((a, b) => {
    const diff = values[a] - values[b];
    // Stable: if equal, preserve original index order
    return diff !== 0 ? diff : a - b;
  });

  // Build a map: original index → { rank, z }
  const rankZ = new Array<{ rank: number; z: number }>(n);
  for (let sortedPos = 0; sortedPos < n; sortedPos++) {
    const originalIdx = indices[sortedPos];
    const rank = (sortedPos + 0.5) / n; // Hazen plotting position
    const z = percentileToProbit(rank);
    rankZ[originalIdx] = { rank, z };
  }

  // Return points in original input order
  return values.map((value, i) => ({
    value,
    rank: rankZ[i].rank,
    z: rankZ[i].z,
  }));
}

// ---------------------------------------------------------------------------
// Probit color mapping
// ---------------------------------------------------------------------------

/**
 * Map a value to a CSS color within a Low→High legend domain {min, max}.
 *
 * Color scheme: cool-to-warm hue interpolation via the short "cool" arc
 *   Low  → hsl(210, 70%, 55%)  — steel blue
 *   High → hsl(20,  85%, 55%)  — warm orange
 *
 * The arc traverses 210 → 270 → 300 → 330 → 380(≡20°), i.e. blue → purple →
 * magenta → orange. This avoids the "dirty green" mid-point of the short
 * 210→20 arc (which passes through ~115° yellow-green) and stays on-brand
 * with Slopcast's cyan/magenta/lavender palette.
 *
 * Uses a manual hue lerp; no external dependencies.
 * Returns a deterministic hsl() string.
 */
export function probitColor(
  value: number,
  domain: { min: number; max: number },
): string {
  const { min, max } = domain;

  // Guard division by zero when min === max
  const t = min === max ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Lerp hue 210 → 380 (≡ 20°) via the cool arc: blue→purple→magenta→orange.
  // Using 380 instead of 20 forces the traversal through 270/300/330 rather
  // than the short path through green/yellow (~115° at midpoint).
  const hueLow  = 210;
  const hueHigh = 380; // 380 % 360 = 20°
  const hue = Math.round(hueLow + t * (hueHigh - hueLow)) % 360;

  // Saturation: 70% → 85%
  const satLow  = 70;
  const satHigh = 85;
  const sat = Math.round(satLow + t * (satHigh - satLow));

  // Lightness: fixed at 55% — consistent perceived brightness across hues
  const lightness = 55;

  return `hsl(${hue},${sat}%,${lightness}%)`;
}
