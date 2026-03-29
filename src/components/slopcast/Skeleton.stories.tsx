import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartSkeleton, GroupComparisonSkeleton, KpiGridSkeleton, Skeleton, TableSkeleton } from './Skeleton';

const meta = {
  title: 'Slopcast/Skeleton',
  component: Skeleton,
  args: {
    variant: 'rect',
    width: '100%',
    height: 48,
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PrimitiveShapes: Story = {
  render: args => (
    <div className="grid gap-4 rounded-panel border border-theme-border bg-theme-surface1/70 p-5 shadow-card sm:grid-cols-3">
      <div className="space-y-2">
        <p className="typo-label">Text lines</p>
        <Skeleton {...args} variant="text" lines={4} />
      </div>
      <div className="space-y-2">
        <p className="typo-label">Card block</p>
        <Skeleton {...args} variant="rect" height={112} />
      </div>
      <div className="space-y-2">
        <p className="typo-label">Avatar</p>
        <Skeleton {...args} variant="circle" width={64} height={64} className="rounded-full" />
      </div>
    </div>
  ),
};

export const DashboardLoading: Story = {
  render: () => (
    <div className="space-y-5">
      <KpiGridSkeleton />
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <ChartSkeleton />
        <GroupComparisonSkeleton />
      </div>
      <TableSkeleton rows={5} cols={4} />
    </div>
  ),
};
