import type { Meta, StoryObj } from '@storybook/react-vite';
import SectionCard from './SectionCard';

const meta = {
  title: 'Slopcast/SectionCard',
  component: SectionCard,
  args: {
    title: 'Economics drivers',
    isClassic: false,
    panelStyle: 'glass',
    children: (
      <div className="space-y-3">
        <p className="typo-body">Stress-test realized pricing, timing, and ownership assumptions before running full economics.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-inner border border-theme-border/60 bg-theme-surface2/40 p-3">
            <p className="typo-label">Oil</p>
            <p className="typo-h3">$78.00 / bbl</p>
          </div>
          <div className="rounded-inner border border-theme-border/60 bg-theme-surface2/40 p-3">
            <p className="typo-label">Gas</p>
            <p className="typo-h3">$3.45 / mcf</p>
          </div>
          <div className="rounded-inner border border-theme-border/60 bg-theme-surface2/40 p-3">
            <p className="typo-label">NRI</p>
            <p className="typo-h3">75%</p>
          </div>
        </div>
      </div>
    ),
  },
} satisfies Meta<typeof SectionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Modern: Story = {};

export const Classic: Story = {
  args: {
    panelStyle: 'solid',
  },
  globals: {
    theme: 'mario',
  },
};
