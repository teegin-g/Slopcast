import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapLayersControl } from './MapLayersControl';

afterEach(() => {
  cleanup();
});

describe('MapLayersControl', () => {
  it('calls onToggle("heat") when the heat button is clicked', () => {
    const onToggle = vi.fn();
    render(
      <MapLayersControl
        isClassic={false}
        visibility={{ heat: false, formations: false }}
        onToggle={onToggle}
      />,
    );

    fireEvent.click(screen.getByTestId('map-layer-heat'));
    expect(onToggle).toHaveBeenCalledWith('heat');
  });

  it('marks the heat button aria-pressed when heat is on', () => {
    render(
      <MapLayersControl
        isClassic={false}
        visibility={{ heat: true, formations: false }}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByTestId('map-layer-heat').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('map-layer-formations').getAttribute('aria-pressed')).toBe('false');
  });
});
