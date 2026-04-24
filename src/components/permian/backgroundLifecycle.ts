import { useEffect, useState, type RefObject } from 'react';
import type { PermianTier } from './useDeviceTier';
import type { PermianFxLevel, PermianMode } from './variants';

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

export function usePageVisibilityPaused(): boolean {
  const [paused, setPaused] = useState(() => (typeof document === 'undefined' ? false : document.hidden));

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return paused;
}

export function useReducedMotionPreference(forceReducedMotion?: boolean): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => forceReducedMotion ?? false);

  useEffect(() => {
    if (forceReducedMotion !== undefined) {
      setReducedMotion(forceReducedMotion);
      return;
    }
    if (typeof window === 'undefined' || !window.matchMedia) {
      setReducedMotion(false);
      return;
    }

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mql.matches);
    sync();
    mql.addEventListener?.('change', sync);
    return () => mql.removeEventListener?.('change', sync);
  }, [forceReducedMotion]);

  return reducedMotion;
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
