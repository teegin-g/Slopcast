import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { useEffect } from 'react';
import HyperboreaBackground from './HyperboreaBackground';
import MoonlightBackground from './MoonlightBackground';
import SynthwaveBackground from './SynthwaveBackground';

type ThemeArtId = 'hyperborea' | 'synthwave' | 'league';
type FxClass = '' | 'fx-max';

interface ThemeArtStoryProps {
  themeId: ThemeArtId;
  fxClass: FxClass;
}

const backgrounds = {
  hyperborea: HyperboreaBackground,
  synthwave: SynthwaveBackground,
  league: MoonlightBackground,
} satisfies Record<ThemeArtId, ComponentType>;

function ThemeArtStoryFrame({ themeId, fxClass }: ThemeArtStoryProps) {
  const Background = backgrounds[themeId];

  useEffect(() => {
    const root = document.documentElement;
    const prev = {
      theme: root.dataset.theme,
      mode: root.dataset.mode,
    };
    root.dataset.theme = themeId;
    root.dataset.mode = 'dark';
    return () => {
      if (prev.theme) root.dataset.theme = prev.theme;
      else delete root.dataset.theme;
      if (prev.mode) root.dataset.mode = prev.mode;
      else delete root.dataset.mode;
    };
  }, [themeId]);

  return (
    <div
      className={`theme-atmo ${fxClass}`}
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 16px)',
        minHeight: 520,
        overflow: 'hidden',
        borderRadius: 14,
        background: '#020611',
      }}
    >
      <Background />
      <div
        style={{
          position: 'absolute',
          inset: '8% 8% auto auto',
          width: 'min(420px, 40vw)',
          minHeight: 160,
          padding: 18,
          borderRadius: 18,
          border: '1px solid rgba(226, 232, 240, 0.18)',
          background: 'rgba(5, 12, 24, 0.68)',
          color: '#e2e8f0',
          boxShadow: '0 24px 90px rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(14px)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.68 }}>
          Visual QA Harness
        </div>
        <div style={{ marginTop: 10, fontSize: 30, fontWeight: 700 }}>
          {themeId === 'league' ? 'Nocturne' : themeId}
        </div>
        <p style={{ marginTop: 10, maxWidth: 320, fontSize: 14, lineHeight: 1.6, opacity: 0.76 }}>
          Background readability sample for WELLS, ECONOMICS, and SCENARIOS chrome.
        </p>
      </div>
    </div>
  );
}

const meta = {
  title: 'Slopcast/Backgrounds/Theme Art Upgrades',
  component: ThemeArtStoryFrame,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    themeId: 'hyperborea',
    fxClass: '',
  },
  argTypes: {
    themeId: {
      control: { type: 'inline-radio' },
      options: ['hyperborea', 'synthwave', 'league'],
    },
    fxClass: {
      control: { type: 'inline-radio' },
      options: ['', 'fx-max'],
    },
  },
} satisfies Meta<typeof ThemeArtStoryFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Hyperborea: Story = {
  args: {
    themeId: 'hyperborea',
  },
};

export const SynthwaveMaxFX: Story = {
  args: {
    themeId: 'synthwave',
    fxClass: 'fx-max',
  },
};

export const Nocturne: Story = {
  args: {
    themeId: 'league',
  },
};
