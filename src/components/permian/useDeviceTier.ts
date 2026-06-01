import { useDeviceTier as useThemeDeviceTier } from '../../theme/scene/useDeviceTier';

/**
 * Decide whether to render the full 3D Permian scene or fall back to the 2D
 * canvas. Fallback triggers:
 *   - shared scene runtime marks the device as low tier (low CPU/RAM or no WebGL2)
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

function readForcedTierFromUrl(): PermianTier | undefined {
  if (typeof window === 'undefined') return 'fallback-2d';

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('permianFallback') === '1') return 'fallback-2d';
  } catch {
    /* ignore — malformed URL */
  }

  return undefined;
}

export function useDeviceTier({ force }: TierOptions = {}): PermianTier {
  const forcedTier = force ?? readForcedTierFromUrl();
  const sharedTier = useThemeDeviceTier({
    force: forcedTier === 'fallback-2d' ? 'low' : forcedTier === 'full-3d' ? 'standard' : undefined,
    requiresWebGL: true,
  });

  if (forcedTier) return forcedTier;
  return sharedTier === 'low' ? 'fallback-2d' : 'full-3d';
}
