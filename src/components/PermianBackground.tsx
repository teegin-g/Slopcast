import React, { Suspense, useMemo, useRef } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import {
  resolvePermianMode,
  shouldUseFallback2D,
  useAtmosphereFxLevel,
} from './permian/backgroundLifecycle';
import { PermianCanvas } from './permian/PermianCanvas';
import { useDeviceTier, type PermianTier } from './permian/useDeviceTier';
import { paletteForMode, type PermianFxLevel, type PermianMode } from './permian/variants';
import { usePageVisibilityPaused } from '../theme/scene/usePageVisibilityPaused';
import { useReducedMotionPreference } from '../theme/scene/useReducedMotionPreference';

const OilRigBackground2D = React.lazy(() => import('./OilRigBackground2D'));

/**
 * PermianBackground — root R3F canvas for the `permian` theme.
 *
 * Responsibilities:
 *   - Pick Dusk or Noon palette based on the effective color mode (overrideable)
 *   - Gate on device tier — falls back to OilRigBackground2D on low-end machines
 *     or when WebGL2 is unavailable
 *   - Cap DPR, pause on document.hidden, freeze under prefers-reduced-motion
 *   - Compose the full post-processing chain (GodRays → Bloom → HeatShimmer →
 *     ChromaticAberration → Noise → Vignette)
 *
 * The scene lives in normalized coords:
 *   x ∈ [-aspect .. +aspect]  (width scales with viewport aspect ratio)
 *   y ∈ [-0.5 .. +0.5]        (world height = 1)
 *   z layering fakes depth (-10 sky → +0.06 foreground trees)
 */

interface PermianBackgroundProps {
  /** Override the mode (ignores the theme provider). Used by Storybook. */
  forceMode?: PermianMode;
  /** Override the fx intensity. Otherwise inferred from `.fx-max` class. */
  forceFxLevel?: PermianFxLevel;
  /** Storybook/testing: force the fallback branch to render. */
  forceTier?: PermianTier;
  /** Storybook/testing: forcibly freeze all animations. */
  forceReducedMotion?: boolean;
}

// --- Root component ------------------------------------------------------
function PermianBackgroundInner(props: PermianBackgroundProps) {
  const { effectiveMode } = useTheme();

  const mode: PermianMode = resolvePermianMode({ forceMode: props.forceMode, effectiveMode });
  const palette = useMemo(() => paletteForMode(mode), [mode]);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const fxLevel: PermianFxLevel = useAtmosphereFxLevel(wrapRef, props.forceFxLevel);
  const paused = usePageVisibilityPaused();
  const reducedMotion = useReducedMotionPreference(props.forceReducedMotion);

  return (
    <div
      ref={wrapRef}
      className="permian-bg-wrap"
      style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <PermianCanvas
        palette={palette}
        fxLevel={fxLevel}
        reducedMotion={reducedMotion}
        paused={paused}
      />
    </div>
  );
}

export default function PermianBackground(props: PermianBackgroundProps = {}) {
  const tier = useDeviceTier({ force: props.forceTier });

  if (shouldUseFallback2D(tier)) {
    return (
      <Suspense fallback={null}>
        <OilRigBackground2D mode={props.forceMode} />
      </Suspense>
    );
  }

  return <PermianBackgroundInner {...props} />;
}
