import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { OverlayToolbar } from './OverlayToolbar';

const meta = {
  title: 'Slopcast/Map/OverlayToolbar',
  component: OverlayToolbar,
  args: {
    isClassic: false,
    activeTool: null,
    onSetTool: fn(),
    layers: { grid: false, heatmap: false, satellite: false },
    onToggleLayer: fn(),
    dataLayers: { producing: true, duc: true, permit: true, laterals: false },
    onToggleDataLayer: fn(),
    isLoading: false,
    source: 'mock' as const,
    dataSourceId: 'mock' as const,
    totalCount: 247,
    truncated: false,
  },
} satisfies Meta<typeof OverlayToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Data')).toBeVisible();
    await expect(canvas.getByText('247')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: /data source: mock\. click to switch to databricks\./i }),
    ).toBeVisible();
    await expect(canvas.getByText('Mock')).toBeVisible();
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const DatabricksSource: Story = {
  args: {
    source: 'databricks' as const,
    dataSourceId: 'live' as const,
    totalCount: 12453,
    truncated: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: /data source: databricks\. click to switch to mock\./i }),
    ).toBeVisible();
    await expect(canvas.getByText('DB')).toBeVisible();
  },
};

export const LiveSelectionWithFallback: Story = {
  args: {
    source: 'mock' as const,
    dataSourceId: 'live' as const,
    fallbackActive: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: /using mock fallback while live is selected\. click to switch to mock\./i }),
    ).toBeVisible();
    await expect(canvas.getByText('Fallback')).toBeVisible();
  },
};

export const AllDataOff: Story = {
  args: {
    dataLayers: { producing: false, duc: false, permit: false, laterals: false },
    totalCount: 0,
  },
};

export const WithActiveTool: Story = {
  args: {
    activeTool: 'lasso',
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
