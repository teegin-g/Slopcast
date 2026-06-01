import { useEffect, useState, type RefObject } from 'react';
import { usePageVisibilityPaused } from '../../theme/scene/usePageVisibilityPaused';
import { useReducedMotionPreference } from '../../theme/scene/useReducedMotionPreference';
import type { PermianTier } from './useDeviceTier';
import type { PermianFxLevel, PermianMode } from './variants';

export { usePageVisibilityPaused, useReducedMotionPreference };

interface ModeResolutionInput {
  forceMode?: PermianMode;
  effectiveMode?: string;
}

interface CanvasSizeInput {
  width: number;
  height: number;
  dpr?: number;
}

export function resolvePermianMode({ forceMode, effectiveMode }: ModeResolutionInput): PermianMode {
  return forceMode ?? (effectiveMode === 'light' ? 'noon' : 'dusk');
}

export function getDocumentModeFromDataset(mode?: string): PermianMode {
  return mode === 'light' ? 'noon' : 'dusk';
}

export function readFxLevelFromClassList(classNames: Iterable<string>): PermianFxLevel {
  for (const className of classNames) {
    if (className === 'fx-max') return 'max';
  }
  return 'cinematic';
}

export function shouldUseFallback2D(tier: PermianTier): boolean {
  return tier === 'fallback-2d';
}

export function computeCanvasSize({ width, height, dpr = 1 }: CanvasSizeInput): { width: number; height: number } {
  const scale = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export function useAtmosphereFxLevel(
  wrapRef: RefObject<HTMLElement | null>,
  forceFxLevel?: PermianFxLevel,
): PermianFxLevel {
  const [domFxLevel, setDomFxLevel] = useState<PermianFxLevel>('cinematic');

  useEffect(() => {
    if (forceFxLevel) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const atmo = wrap.closest('.theme-atmo') as HTMLElement | null;
    if (!atmo) return;

    const read = () => setDomFxLevel(readFxLevelFromClassList(atmo.classList));
    read();
    const observer = new MutationObserver(read);
    observer.observe(atmo, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [forceFxLevel, wrapRef]);

  return forceFxLevel ?? domFxLevel;
}
