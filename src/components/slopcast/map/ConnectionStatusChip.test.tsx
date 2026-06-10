import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ConnectionStatusChip from './ConnectionStatusChip';

afterEach(() => {
  cleanup();
});

describe('ConnectionStatusChip', () => {
  it('renders the "Live" label with a green indicator when level is ok', () => {
    render(<ConnectionStatusChip level="ok" title="Live" isClassic={false} />);

    const chip = screen.getByTestId('connection-status-chip');
    expect(chip).toBeTruthy();
    // Never color-only: the textual label must be present.
    expect(chip.textContent).toContain('Live');

    // The status dot carries a green (success) color, not color-only on the chip.
    const dot = chip.querySelector('[data-status-dot]');
    expect(dot).not.toBeNull();
    expect(dot!.className).toContain('bg-theme-success');
  });

  it('renders the degraded title with an amber indicator', () => {
    render(<ConnectionStatusChip level="degraded" title="Showing fallback data" isClassic={false} />);

    const chip = screen.getByTestId('connection-status-chip');
    expect(chip.textContent).toContain('Showing fallback data');

    const dot = chip.querySelector('[data-status-dot]');
    expect(dot).not.toBeNull();
    expect(dot!.className).toContain('bg-theme-warning');
  });

  it('renders the down title with a red indicator', () => {
    render(<ConnectionStatusChip level="down" title="Live data unreachable" isClassic={false} />);

    const chip = screen.getByTestId('connection-status-chip');
    expect(chip.textContent).toContain('Live data unreachable');

    const dot = chip.querySelector('[data-status-dot]');
    expect(dot).not.toBeNull();
    expect(dot!.className).toContain('bg-red-400');
  });

  it('always renders a visible text label (never color-only)', () => {
    const { rerender } = render(<ConnectionStatusChip level="ok" title="Live" isClassic />);
    expect(screen.getByText('Live')).toBeTruthy();

    rerender(<ConnectionStatusChip level="down" title="Map unavailable" isClassic />);
    expect(screen.getByText('Map unavailable')).toBeTruthy();
  });
});
