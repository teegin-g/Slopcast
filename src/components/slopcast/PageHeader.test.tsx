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
  viewMode: 'DASHBOARD' as const,
  onSetViewMode: vi.fn(),
  designWorkspace: 'WELLS' as const,
  onSetDesignWorkspace: vi.fn(),
  economicsNeedsAttention: false,
  wellsNeedsAttention: false,
  onNavigateHub: vi.fn(),
  atmosphericOverlays: [],
  headerAtmosphereClass: '',
  fxClass: '',
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PageHeader', () => {
  it('opens the logo theme dropdown and keeps theme option test ids clickable', () => {
    const setThemeId = vi.fn();
    render(<PageHeader {...baseProps} setThemeId={setThemeId} />);

    fireEvent.click(screen.getByTestId('theme-dropdown-toggle'));
    fireEvent.click(screen.getByTestId('theme-option-synthwave'));

    expect(setThemeId).toHaveBeenCalledWith('synthwave');
    expect(screen.queryByRole('listbox', { name: /theme selector/i })).toBeNull();
  });
});
