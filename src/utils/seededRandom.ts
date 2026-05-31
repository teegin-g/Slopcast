/**
 * seededRandom — deterministic pseudo-random number generator (Lehmer / Park-Miller LCG).
 *
 * Returns a function that yields a new float in [0, 1) on each call. Used across the
 * animated canvas backgrounds to lay out stars, clouds, particles, buildings, etc. so
 * their geometry is identical every reload.
 *
 * IMPORTANT: the `multiplier` parameter is load-bearing. Different backgrounds were
 * authored with different multipliers (16807 vs 48271) which produce DIFFERENT random
 * sequences. Each call site MUST pass the multiplier it originally used so its rendered
 * layout stays byte-identical. Do NOT canonicalize to a single multiplier.
 *
 *   modulus is the Mersenne prime 2^31 - 1 = 2147483647.
 */
export function seededRandom(seed: number, multiplier = 16807): () => number {
  let s = seed;
  return () => {
    s = (s * multiplier) % 2147483647;
    return s / 2147483647;
  };
}
