import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { THEMES } from '../../theme/registry';
import PageHeader from './PageHeader';

const baseProps = {
  isClassic: false,
  theme: THEMES[0],
  themes: THEMES,
  themeId: THEMES[0].id,
  setThemeId: vi.fn(),
  scenarioName: 'Base Case',
  priceDeck: '$75 / $3.25',
  connectionLevel: 'ok' as const,
  connectionTitle: 'Live',
  atmosphericOverlays: [],
  headerAtmosphereClass: '',
  fxClass: '',
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PageHeader', () => {
  it('opens the theme selector menu and keeps theme option test ids clickable', () => {
    const setThemeId = vi.fn();
    render(<PageHeader {...baseProps} setThemeId={setThemeId} />);

    fireEvent.click(screen.getByTestId('theme-selector-trigger'));
    fireEvent.click(screen.getByTestId('theme-selector-option-synthwave'));

    expect(setThemeId).toHaveBeenCalledWith('synthwave');
    expect(screen.queryByRole('listbox', { name: /choose theme/i })).toBeNull();
  });

  it('renders the connection status chip', () => {
    render(<PageHeader {...baseProps} />);
    const chip = screen.getByTestId('connection-status-chip');
    expect(chip).toBeTruthy();
    expect(chip.textContent).toContain('Live');
  });

  it('renders the scenario and price-deck context chips when provided', () => {
    render(<PageHeader {...baseProps} />);
    expect(screen.getByTestId('header-scenario-chip').textContent).toContain('Base Case');
    expect(screen.getByTestId('header-pricedeck-chip').textContent).toContain('$75 / $3.25');
  });

  it('omits the scenario and price-deck chips gracefully when absent', () => {
    render(<PageHeader {...baseProps} scenarioName={null} priceDeck={null} />);
    expect(screen.queryByTestId('header-scenario-chip')).toBeNull();
    expect(screen.queryByTestId('header-pricedeck-chip')).toBeNull();
    // The connection chip is always present.
    expect(screen.getByTestId('connection-status-chip')).toBeTruthy();
  });
});
