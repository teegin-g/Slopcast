import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { OverlayFiltersBar } from './OverlayFiltersBar';

const meta = {
  title: 'Slopcast/Map/OverlayFiltersBar',
  component: OverlayFiltersBar,
  args: {
    isClassic: false,
    visibleCount: 35,
    selectedCount: 8,
    totalCount: 40,
    activeGroupName: 'Tier 1 - Core',
    activeGroupColor: '#38bdf8',
    statusCounts: { producing: 14, duc: 13, permit: 13 },
    operatorFilter: new Set<string>(),
    formationFilter: new Set<string>(),
    statusFilter: new Set<string>(),
    operatorOptions: ['Pioneer', 'Devon', 'ConocoPhillips'],
    formationOptions: ['Wolfcamp A', 'Bone Spring', 'Spraberry'],
    statusOptions: ['PRODUCING', 'DUC', 'PERMIT'],
    onToggleOperator: fn(),
    onToggleFormation: fn(),
    onToggleStatus: fn(),
    onResetFilters: fn(),
    onSelectAll: fn(),
    onClearSelection: fn(),
  },
} satisfies Meta<typeof OverlayFiltersBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoActiveGroup: Story = {
  args: {
    activeGroupName: undefined,
  },
};

export const ActiveFilters: Story = {
  args: {
    operatorFilter: new Set(['Pioneer']),
    formationFilter: new Set(['Wolfcamp A']),
    visibleCount: 12,
  },
};

export const ClassicTheme: Story = {
  args: {
    isClassic: true,
  },
  globals: {
    theme: 'mario',
  },
};

export const TropicalTheme: Story = {
  globals: {
    theme: 'tropical',
  },
};
