import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { getTheme, THEMES } from '../../theme/registry';
import type { ThemeId } from '../../theme/types';
import ThemeSelectorMenu from './ThemeSelectorMenu';

interface StoryHarnessProps {
  initialThemeId: ThemeId;
  isClassic?: boolean;
  narrow?: boolean;
}

function ThemeSelectorMenuHarness({ initialThemeId, isClassic = false, narrow = false }: StoryHarnessProps) {
  const [themeId, setThemeId] = useState<ThemeId>(initialThemeId);
  const theme = getTheme(themeId);

  return (
    <div className={`min-h-[24rem] p-6 ${narrow ? 'max-w-[18rem]' : 'max-w-[32rem]'}`}>
      <ThemeSelectorMenu
        isClassic={isClassic || themeId === 'mario'}
        theme={theme}
        themes={THEMES}
        themeId={themeId}
        setThemeId={setThemeId}
      />
      <p className="mt-4 typo-body text-theme-muted">
        Active theme: <span className="text-theme-text">{theme.label}</span>
      </p>
    </div>
  );
}

const meta = {
  title: 'Slopcast/ThemeSelectorMenu',
  component: ThemeSelectorMenuHarness,
  args: {
    initialThemeId: 'slate',
    isClassic: false,
    narrow: false,
  },
} satisfies Meta<typeof ThemeSelectorMenuHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByTestId('theme-selector-trigger'));
    await expect(canvas.getByRole('listbox', { name: /choose theme/i })).toBeInTheDocument();
    await userEvent.click(canvas.getByTestId('theme-selector-option-permian'));
    await expect(canvas.getByText(/active theme:/i)).toHaveTextContent(/permian/i);
  },
};

export const Narrow: Story = {
  args: {
    narrow: true,
  },
};

export const ClassicTheme: Story = {
  args: {
    initialThemeId: 'mario',
    isClassic: true,
  },
  globals: {
    theme: 'mario',
  },
};
