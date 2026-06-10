import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import { OverlayFiltersBar } from './OverlayFiltersBar';
import type { Well } from '../../../types';

afterEach(() => {
  cleanup();
});

const statusOptions: Well['status'][] = ['PRODUCING', 'DUC', 'PERMIT'];

function renderBar(overrides: Partial<React.ComponentProps<typeof OverlayFiltersBar>> = {}) {
  const props: React.ComponentProps<typeof OverlayFiltersBar> = {
    isClassic: false,
    visibleCount: 35,
    selectedCount: 8,
    totalCount: 40,
    operatorFilter: new Set<string>(),
    formationFilter: new Set<string>(),
    statusFilter: new Set<string>(),
    operatorOptions: ['Pioneer', 'Devon'],
    formationOptions: ['Wolfcamp A', 'Bone Spring'],
    statusOptions,
    onToggleOperator: vi.fn(),
    onToggleFormation: vi.fn(),
    onToggleStatus: vi.fn(),
    onResetFilters: vi.fn(),
    onSelectAll: vi.fn(),
    onClearSelection: vi.fn(),
    ...overrides,
  };
  return render(
    <ThemeProvider>
      <OverlayFiltersBar {...props} />
    </ThemeProvider>,
  );
}

describe('OverlayFiltersBar', () => {
  it('renders the active group context (name + status counts) when provided', () => {
    renderBar({
      activeGroupName: 'Tier 1 - Core',
      activeGroupColor: '#38bdf8',
      statusCounts: { producing: 14, duc: 13, permit: 13 },
    });

    const group = screen.getByTestId('map-context-group');
    expect(group).toBeTruthy();
    expect(group.textContent).toContain('Tier 1 - Core');
    expect(group.textContent).toContain('14 P');
    expect(group.textContent).toContain('13 D');
    expect(group.textContent).toContain('13 Pm');
  });

  it('omits the group segment when no active group, still rendering counts + filters', () => {
    renderBar();

    expect(screen.queryByTestId('map-context-group')).toBeNull();
    // Well counts + filter dropdowns still render.
    expect(screen.getByText('35 Visible')).toBeTruthy();
    expect(screen.getByTestId('wells-filter-operator')).toBeTruthy();
    expect(screen.getByTestId('wells-filter-status')).toBeTruthy();
  });

  it('no longer uses the obsolete groups-panel left offset', () => {
    renderBar({ activeGroupName: 'Tier 1 - Core' });

    const strip = screen.getByTestId('map-context-strip');
    expect(strip.className).not.toContain('left-[300px]');
    expect(strip.className).toContain('left-3');
  });
});
