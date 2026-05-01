import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { createStoryGroup } from '../storybookData';
import { WellPopupCard } from './WellPopupCard';
import type { Well } from '../../../types';

const well: Well = {
  id: 'w-popup',
  name: 'KNIGHT 115 MIPA UNIT H115WA',
  operator: 'PERMIAN DEEP ROCK OIL CO LLC',
  formation: 'WOLFCAMP A',
  status: 'PRODUCING',
  lateralLength: 12_234,
  lat: 32.038,
  lng: -102.0889,
};

const meta = {
  title: 'Slopcast/Map/WellPopupCard',
  component: WellPopupCard,
  args: {
    well,
    groups: [createStoryGroup('core', 'Tier 1 - Core', '#4F8BFF', ['w-popup'])],
    position: { x: 220, y: 220 },
    isClassic: false,
    onClose: fn(),
  },
  decorators: [
    (Story) => (
      <div className="relative h-[360px] w-[520px] bg-theme-bg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WellPopupCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Slate: Story = {};

export const Tropical: Story = {
  globals: {
    theme: 'tropical',
  },
};

export const Classic: Story = {
  args: {
    isClassic: true,
  },
  globals: {
    theme: 'mario',
  },
};
