import { useEffect, useState } from 'react';

/**
 * Decide whether to render the full 3D Permian scene or fall back to the 2D
 * canvas. Fallback triggers:
 *   - `navigator.hardwareConcurrency < 4`  (low CPU)
 *   - `navigator.deviceMemory < 4`         (low RAM)
 *   - WebGL2 unavailable / context creation fails
 *   - `forceFallback` URL hint (`?permianFallback=1`) — handy for manual QA
 *
 * Evaluated once on mount; the result is stable for the session so toggling
 * the theme on/off doesn't thrash Canvas mounts.
 */
export type PermianTier = 'full-3d' | 'fallback-2d';

interface TierOptions {
  /** Storybook or explicit caller override; skips feature detection entirely. */
  force?: PermianTier;
}

function detectTier(): PermianTier {
  if (typeof window === 'undefined') return 'fallback-2d';

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('permianFallback') === '1') return 'fallback-2d';
  } catch {
    /* ignore — malformed URL */
  }

  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < 4) {
    return 'fallback-2d';
  }
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) {
    return 'fallback-2d';
  }

  // Probe for a WebGL2 context. A failed probe means the user is either on a
  // very old browser or has hardware acceleration disabled — either way, the
  // 2D scene is the safer bet.
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return 'fallback-2d';
  } catch {
    return 'fallback-2d';
  }

  return 'full-3d';
}

export function useDeviceTier({ force }: TierOptions = {}): PermianTier {
  const [tier, setTier] = useState<PermianTier>(() => force ?? 'full-3d');

  useEffect(() => {
    if (force) {
      setTier(force);
      return;
    }
    setTier(detectTier());
  }, [force]);

  return tier;
}
