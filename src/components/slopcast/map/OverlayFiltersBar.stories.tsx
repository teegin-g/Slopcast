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
    groupsPanelOpen: false,
    operatorFilter: 'ALL',
    formationFilter: 'ALL',
    statusFilter: 'ALL',
    operatorOptions: ['Pioneer', 'Devon', 'ConocoPhillips'],
    formationOptions: ['Wolfcamp A', 'Bone Spring', 'Spraberry'],
    statusOptions: ['PRODUCING', 'DUC', 'PERMIT'],
    onSetOperatorFilter: fn(),
    onSetFormationFilter: fn(),
    onSetStatusFilter: fn(),
    onResetFilters: fn(),
  },
} satisfies Meta<typeof OverlayFiltersBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ActiveFilters: Story = {
  args: {
    operatorFilter: 'Pioneer',
    formationFilter: 'Wolfcamp A',
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
