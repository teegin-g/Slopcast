import { useEffect, useState } from 'react';
import type { ThemeDeviceTier } from './types';

interface DeviceTierOptions {
  /** Storybook/testing override; skips browser feature detection. */
  force?: ThemeDeviceTier;
  /** Probe WebGL2 availability for scenes that need the high-control renderer path. */
  requiresWebGL?: boolean;
}

function hasWebGL2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}

function detectDeviceTier(requiresWebGL = false): ThemeDeviceTier {
  if (typeof window === 'undefined') return 'low';

  const nav = navigator as Navigator & { deviceMemory?: number };
  const hardwareConcurrency = nav.hardwareConcurrency ?? 0;
  const deviceMemory = nav.deviceMemory ?? 0;

  if (hardwareConcurrency > 0 && hardwareConcurrency < 4) return 'low';
  if (deviceMemory > 0 && deviceMemory < 4) return 'low';
  if (requiresWebGL && !hasWebGL2()) return 'low';

  if (hardwareConcurrency >= 8 && (deviceMemory === 0 || deviceMemory >= 8)) return 'high';
  return 'standard';
}

export function useDeviceTier({ force, requiresWebGL = false }: DeviceTierOptions = {}): ThemeDeviceTier {
  const [tier, setTier] = useState<ThemeDeviceTier>(() => force ?? 'standard');

  useEffect(() => {
    if (force) {
      setTier(force);
      return;
    }
    setTier(detectDeviceTier(requiresWebGL));
  }, [force, requiresWebGL]);

  return tier;
}
