import { describe, expect, it } from 'vitest';
import {
  computeCanvasSize,
  getDocumentModeFromDataset,
  readFxLevelFromClassList,
  resolvePermianMode,
  shouldUseFallback2D,
} from './backgroundLifecycle';

describe('resolvePermianMode', () => {
  it('uses forced mode before theme mode', () => {
    expect(resolvePermianMode({ forceMode: 'dusk', effectiveMode: 'light' })).toBe('dusk');
  });

  it('maps light theme mode to noon and every other mode to dusk', () => {
    expect(resolvePermianMode({ effectiveMode: 'light' })).toBe('noon');
    expect(resolvePermianMode({ effectiveMode: 'dark' })).toBe('dusk');
  });
});

describe('getDocumentModeFromDataset', () => {
  it('maps document data-mode to the 2D fallback palette mode', () => {
    expect(getDocumentModeFromDataset('light')).toBe('noon');
    expect(getDocumentModeFromDataset('dark')).toBe('dusk');
    expect(getDocumentModeFromDataset(undefined)).toBe('dusk');
  });
});

describe('readFxLevelFromClassList', () => {
  it('returns max only when fx-max is present', () => {
    expect(readFxLevelFromClassList(['theme-atmo', 'fx-max'])).toBe('max');
    expect(readFxLevelFromClassList(['theme-atmo', 'fx-cinematic'])).toBe('cinematic');
  });
});

describe('shouldUseFallback2D', () => {
  it('uses the 2D fallback only for fallback tier', () => {
    expect(shouldUseFallback2D('fallback-2d')).toBe(true);
    expect(shouldUseFallback2D('full-3d')).toBe(false);
  });
});

describe('computeCanvasSize', () => {
  it('scales CSS viewport dimensions by device pixel ratio', () => {
    expect(computeCanvasSize({ width: 320, height: 200, dpr: 2 })).toEqual({ width: 640, height: 400 });
  });

  it('uses DPR 1 when the browser reports an unusable value', () => {
    expect(computeCanvasSize({ width: 320, height: 200, dpr: 0 })).toEqual({ width: 320, height: 200 });
  });
});
