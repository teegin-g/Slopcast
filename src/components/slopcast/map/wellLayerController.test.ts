import { describe, expect, it, vi } from 'vitest';
import {
  WELL_STATUS_LAYER_IDS,
  bindWellLayerEvents,
  buildWellColorMatchExpression,
} from './wellLayerController';

describe('wellLayerController', () => {
  it('builds a stable Mapbox match expression for well colors', () => {
    const expr = buildWellColorMatchExpression(
      [
        { id: 'b', name: 'B', lat: 0, lng: 0, lateralLength: 1, status: 'DUC', operator: 'A', formation: 'X' },
        { id: 'a', name: 'A', lat: 0, lng: 0, lateralLength: 1, status: 'PRODUCING', operator: 'A', formation: 'X' },
      ],
      id => (id === 'a' ? '#aaa' : '#bbb'),
      '#999',
    );

    expect(expr).toEqual(['match', ['get', 'id'], 'b', '#bbb', 'a', '#aaa', '#999']);
  });

  it('unregisters every handler it registers', () => {
    const on = vi.fn();
    const off = vi.fn();
    const map = {
      on,
      off,
      getCanvas: () => ({ style: {} }),
      queryRenderedFeatures: () => [],
      getSource: () => ({ getClusterExpansionZoom: vi.fn() }),
      easeTo: vi.fn(),
    };

    const cleanup = bindWellLayerEvents(map, {
      onWellClick: vi.fn(),
      onWellHover: vi.fn(),
      onWellLeave: vi.fn(),
      onMapEmptyClick: vi.fn(),
    });
    cleanup();

    expect(on).toHaveBeenCalledTimes(WELL_STATUS_LAYER_IDS.length * 4 + 4);
    expect(off).toHaveBeenCalledTimes(on.mock.calls.length);
  });
});
