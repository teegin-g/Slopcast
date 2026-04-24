import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { Suspense, useEffect } from 'react';
import PermianBackground from './PermianBackground';

/**
 * The Permian background is the first Slopcast background to ship as a 3D
 * scene (react-three-fiber + postprocessing) with a 2D Canvas fallback for
 * low-end machines. Because it reads `document.documentElement.dataset.theme`
 * and `data-mode` to resolve tokens, each story sets those attributes in a
 * wrapper `<div>`-adjacent `useEffect`.
 */

interface WrapperProps {
  themeId: 'permian';
  mode: 'dark' | 'light';
  fxClass: '' | 'fx-max';
  forceTier?: 'full-3d' | 'fallback-2d';
  forceReducedMotion?: boolean;
  forceMode?: 'dusk' | 'noon';
  forceFxLevel?: 'cinematic' | 'max';
}

/** Sets the root `data-theme` / `data-mode` / `fx-max` classes so the
 *  CSS tokens resolve identically to how AppShell renders them at runtime. */
function PermianStoryFrame({
  themeId,
  mode,
  fxClass,
  forceTier,
  forceReducedMotion,
  forceMode,
  forceFxLevel,
}: WrapperProps) {
  useEffect(() => {
    const root = document.documentElement;
    const prev = {
      theme: root.dataset.theme,
      mode: root.dataset.mode,
      hasFxMax: root.classList.contains('fx-max'),
    };
    root.dataset.theme = themeId;
    root.dataset.mode = mode;
    if (fxClass === 'fx-max') root.classList.add('fx-max');
    else root.classList.remove('fx-max');
    return () => {
      if (prev.theme) root.dataset.theme = prev.theme;
      else delete root.dataset.theme;
      if (prev.mode) root.dataset.mode = prev.mode;
      else delete root.dataset.mode;
      if (prev.hasFxMax) root.classList.add('fx-max');
      else root.classList.remove('fx-max');
    };
  }, [themeId, mode, fxClass]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 16px)',
        minHeight: 480,
        overflow: 'hidden',
        borderRadius: 12,
      }}
    >
      <Suspense fallback={<div style={{ padding: 16, color: '#6b8' }}>Loading 3D scene…</div>}>
        <PermianBackground
          forceTier={forceTier}
          forceReducedMotion={forceReducedMotion}
          forceMode={forceMode}
          forceFxLevel={forceFxLevel}
        />
      </Suspense>
      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          padding: '6px 10px',
          borderRadius: 999,
          fontFamily: 'Barlow Condensed, Syne, sans-serif',
          fontSize: 14,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          background: 'rgba(10, 31, 24, 0.72)',
          color: '#e2f2e8',
          boxShadow: '0 0 16px rgba(0, 232, 144, 0.3)',
        }}
      >
        {forceMode ?? mode} · {forceFxLevel ?? (fxClass === 'fx-max' ? 'max' : 'cinematic')}
        {forceTier === 'fallback-2d' ? ' · 2D fallback' : ''}
        {forceReducedMotion ? ' · reduced motion' : ''}
      </div>
    </div>
  );
}

const meta = {
  title: 'Slopcast/Backgrounds/Permian',
  component: PermianStoryFrame,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Hero backdrop for the `permian` theme. Orthographic react-three-fiber scene with GodRays/Bloom/HeatShimmer/ChromaticAberration/Noise/Vignette, dusk (dark) + noon (light) variants, and a 2D canvas fallback for low-end devices.',
      },
    },
  },
  args: {
    themeId: 'permian',
    mode: 'dark',
    fxClass: '',
    forceTier: undefined,
    forceReducedMotion: false,
    forceMode: undefined,
    forceFxLevel: undefined,
  },
  argTypes: {
    themeId: { control: false, table: { disable: true } },
    mode: {
      control: { type: 'inline-radio' },
      options: ['dark', 'light'],
      description: 'Selects dusk (dark) or noon (light) variant via document data-mode',
    },
    fxClass: {
      control: { type: 'inline-radio' },
      options: ['', 'fx-max'],
      description: 'Matches the body-level fx-max toggle used in the real app',
    },
    forceTier: {
      control: { type: 'inline-radio' },
      options: [undefined, 'full-3d', 'fallback-2d'],
      description: 'Force-render the 3D or 2D branch regardless of device tier',
    },
    forceMode: {
      control: { type: 'inline-radio' },
      options: [undefined, 'dusk', 'noon'],
      description: 'Bypass the theme provider and pin the palette',
    },
    forceFxLevel: {
      control: { type: 'inline-radio' },
      options: [undefined, 'cinematic', 'max'],
      description: 'Bypass the fx-max class and pin the FX intensity',
    },
    forceReducedMotion: {
      control: { type: 'boolean' },
      description: 'Freeze every animation (pumpjack, derrick, particles, shimmer)',
    },
  },
} satisfies Meta<typeof PermianStoryFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Dusk: Story = {
  args: {
    mode: 'dark',
  },
};

export const DuskMaxFX: Story = {
  args: {
    mode: 'dark',
    fxClass: 'fx-max',
    forceFxLevel: 'max',
  },
};

export const Noon: Story = {
  args: {
    mode: 'light',
    forceMode: 'noon',
  },
};

export const NoonMaxFX: Story = {
  args: {
    mode: 'light',
    forceMode: 'noon',
    fxClass: 'fx-max',
    forceFxLevel: 'max',
  },
};

export const DuskReducedMotion: Story = {
  args: {
    mode: 'dark',
    forceReducedMotion: true,
  },
};

export const Fallback2D: Story = {
  args: {
    mode: 'dark',
    forceTier: 'fallback-2d',
  },
};

export const Fallback2DNoon: Story = {
  args: {
    mode: 'light',
    forceMode: 'noon',
    forceTier: 'fallback-2d',
  },
};
