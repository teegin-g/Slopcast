import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import type { WellGroup } from '../../types';

// Minimal mock groups for testing
const mockGroups: WellGroup[] = [
  {
    id: 'g-1',
    name: 'Tier 1 - Core',
    color: '#4488ff',
    wellIds: new Set(['w-1', 'w-2', 'w-3']),
    typeCurve: { qi: 850, b: 1.2, di: 65, terminalDecline: 6, gorMcfPerBbl: 2.5 },
    capex: { rigCount: 1, drillDurationDays: 18, stimDurationDays: 12, rigStartDate: '2025-01-01', items: [] },
    opex: { segments: [] },
    ownership: { baseNri: 0.75, baseCostInterest: 1.0, agreements: [] },
  },
  {
    id: 'g-2',
    name: 'Tier 2 - Edge',
    color: '#ff4488',
    wellIds: new Set(['w-4']),
    typeCurve: { qi: 850, b: 1.2, di: 65, terminalDecline: 6, gorMcfPerBbl: 2.5 },
    capex: { rigCount: 1, drillDurationDays: 18, stimDurationDays: 12, rigStartDate: '2025-01-01', items: [] },
    opex: { segments: [] },
    ownership: { baseNri: 0.75, baseCostInterest: 1.0, agreements: [] },
  },
];

const defaultProps = {
  collapsed: false,
  onToggleCollapse: vi.fn(),
  section: 'wells' as const,
  onSetSection: vi.fn(),
  isClassic: false,
  groups: mockGroups,
  activeGroupId: 'g-1',
  onActivateGroup: vi.fn(),
};

describe('Sidebar', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders 3 navigation sections (Wells, Economics, Scenarios)', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Wells')).toBeTruthy();
    expect(screen.getByText('Economics')).toBeTruthy();
    expect(screen.getByText('Scenarios')).toBeTruthy();
  });

  it('highlights active section', () => {
    const { container } = render(<Sidebar {...defaultProps} section="economics" />);
    const economicsBtn = screen.getByText('Economics').closest('button')!;
    // Active section should have cyan styling class
    expect(economicsBtn.className).toContain('text-theme-cyan');
  });

  it('collapses to icon-only mode when collapsed=true', () => {
    render(<Sidebar {...defaultProps} collapsed={true} />);
    // Labels should not be visible
    expect(screen.queryByText('Wells')).toBeNull();
    expect(screen.queryByText('Economics')).toBeNull();
    expect(screen.queryByText('Scenarios')).toBeNull();
    // Branding text should not be visible
    expect(screen.queryByText('Slopcast')).toBeNull();
  });

  it('renders well group list', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Tier 1 - Core')).toBeTruthy();
    expect(screen.getByText('Tier 2 - Edge')).toBeTruthy();
  });

  it('highlights active group', () => {
    render(<Sidebar {...defaultProps} activeGroupId="g-1" />);
    const groupBtn = screen.getByText('Tier 1 - Core').closest('button')!;
    expect(groupBtn.className).toContain('text-theme-cyan');
  });

  it('calls onActivateGroup when a group is clicked', () => {
    const onActivateGroup = vi.fn();
    render(<Sidebar {...defaultProps} onActivateGroup={onActivateGroup} />);
    fireEvent.click(screen.getByText('Tier 2 - Edge'));
    expect(onActivateGroup).toHaveBeenCalledWith('g-2');
  });

  it('calls onSetSection when a nav item is clicked', () => {
    const onSetSection = vi.fn();
    render(<Sidebar {...defaultProps} onSetSection={onSetSection} />);
    fireEvent.click(screen.getByText('Scenarios'));
    expect(onSetSection).toHaveBeenCalledWith('scenarios');
  });

  it('shows well count badge for each group', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('3')).toBeTruthy(); // g-1 has 3 wells
    expect(screen.getByText('1')).toBeTruthy(); // g-2 has 1 well
  });

  it('hides group tree when collapsed', () => {
    render(<Sidebar {...defaultProps} collapsed={true} />);
    expect(screen.queryByText('Well Groups')).toBeNull();
    expect(screen.queryByText('Tier 1 - Core')).toBeNull();
  });
});
