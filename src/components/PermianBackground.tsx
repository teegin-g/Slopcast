import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { BlendFunction, KernelSize } from 'postprocessing';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  GodRays,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { useTheme } from '../theme/ThemeProvider';
import { paletteForMode, type PermianFxLevel, type PermianMode, type PermianPalette } from './permian/variants';
import { SkyDome } from './permian/SkyDome';
import { Terrain } from './permian/Terrain';
import { Pumpjacks } from './permian/Pumpjack';
import { Derrick } from './permian/Derrick';
import { FracSpread } from './permian/FracSpread';
import { Trees, Workers } from './permian/Sprites';
import { HeatShimmerEffect } from './permian/HeatShimmerEffect';
import { RIDGE_LAYERS, hillY } from './permian/hillNoise';
import { useDeviceTier, type PermianTier } from './permian/useDeviceTier';

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

// --- FX scaling factors --------------------------------------------------
const FX_SCALE: Record<PermianFxLevel, { bloom: number; godRays: number; noise: number; vignette: number; shimmer: number }> = {
  cinematic: { bloom: 1, godRays: 1, noise: 1, vignette: 1, shimmer: 1 },
  max: { bloom: 1.4, godRays: 1.3, noise: 1.3, vignette: 1.1, shimmer: 1.25 },
};

// --- Viewport helper -----------------------------------------------------
function useViewportAspect(): number {
  const { viewport } = useThree();
  return viewport.width / viewport.height;
}

// --- Sun mesh (emissive; acts as GodRays source) -------------------------
interface SunMeshProps {
  palette: PermianPalette;
  aspect: number;
  meshRef: React.MutableRefObject<THREE.Mesh | null>;
}

function SunMesh({ palette, aspect, meshRef }: SunMeshProps) {
  const worldX = -aspect + palette.sunX * aspect * 2;
  const worldY = 0.5 - palette.sunY;
  const radius = palette.sunRadius * 0.85;
  return (
    <mesh
      ref={meshRef}
      position={[worldX, worldY, -5]}
      renderOrder={-5}
    >
      <circleGeometry args={[radius, 40]} />
      <meshBasicMaterial color={palette.sun} toneMapped={false} />
    </mesh>
  );
}

// --- Clock pause helper --------------------------------------------------
/**
 * Pauses R3F's useFrame delta when the document is hidden. Internal to the
 * Canvas tree so it can access the three.js clock directly.
 */
function ClockPauseController({ paused }: { paused: boolean }) {
  const { clock, invalidate } = useThree();
  useEffect(() => {
    if (paused) {
      clock.stop();
    } else {
      clock.start();
      invalidate();
    }
  }, [paused, clock, invalidate]);
  return null;
}

// --- Scene graph ---------------------------------------------------------
interface SceneProps {
  palette: PermianPalette;
  fxLevel: PermianFxLevel;
  reducedMotion: boolean;
}

function PermianScene({ palette, fxLevel, reducedMotion }: SceneProps) {
  const aspect = useViewportAspect();
  const sunRef = useRef<THREE.Mesh | null>(null);

  // Single allocation per Scene mount. shimmerRef keeps a handle so useFrame
  // can update the amplitude cheaply.
  const heatShimmer = useMemo(() => new HeatShimmerEffect({ amplitude: 0, cutoff: 0.42, speed: 1.1 }), []);
  useEffect(() => () => heatShimmer.dispose(), [heatShimmer]);

  const derrick = useMemo(() => {
    const ridge = RIDGE_LAYERS.find(r => r.name === 'near')!;
    const xNorm = 0.48;
    const worldX = -aspect + xNorm * aspect * 2;
    const groundY = 0.5 - (ridge.y + hillY(ridge.seed, xNorm, ridge.amp));
    return { worldX, groundY };
  }, [aspect]);

  const fracSpread = useMemo(() => {
    const ridge = RIDGE_LAYERS.find(r => r.name === 'near')!;
    const xNorm = 0.28;
    const worldX = -aspect + xNorm * aspect * 2;
    const groundY = 0.5 - (ridge.y + hillY(ridge.seed, xNorm, ridge.amp));
    return { worldX, groundY };
  }, [aspect]);

  const targetShimmer = palette.heatShimmerAmplitude * FX_SCALE[fxLevel].shimmer * (reducedMotion ? 0 : 1);
  useFrame(() => {
    const current = heatShimmer.amplitude;
    heatShimmer.amplitude = current + (targetShimmer - current) * 0.05;
  });

  const scale = FX_SCALE[fxLevel];
  const chromOffset = useMemo(() => new THREE.Vector2(0.0004, 0.0006), []);

  return (
    <>
      <SkyDome palette={palette} aspect={aspect} />
      <Terrain palette={palette} aspect={aspect} />

      <SunMesh palette={palette} aspect={aspect} meshRef={sunRef} />

      <Pumpjacks palette={palette} aspect={aspect} frozen={reducedMotion} />
      <Derrick
        worldX={derrick.worldX}
        groundY={derrick.groundY}
        aspect={aspect}
        palette={palette}
        frozen={reducedMotion}
      />
      <FracSpread
        worldX={fracSpread.worldX}
        groundY={fracSpread.groundY}
        aspect={aspect}
        palette={palette}
        frozen={reducedMotion}
      />

      <Trees aspect={aspect} palette={palette} frozen={reducedMotion} />
      <Workers aspect={aspect} palette={palette} frozen={reducedMotion} />

      {/* Post-processing stack ------------------------------------------- */}
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <GodRays
          sun={sunRef as React.RefObject<THREE.Mesh>}
          blendFunction={BlendFunction.SCREEN}
          samples={reducedMotion ? 30 : 60}
          density={palette.godRaysDensity}
          decay={0.94}
          weight={palette.godRaysWeight * scale.godRays}
          exposure={0.34}
          clampMax={1}
          kernelSize={KernelSize.SMALL}
          blur
        />

        <Bloom
          intensity={palette.bloomIntensity * scale.bloom}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.2}
          mipmapBlur
          kernelSize={KernelSize.MEDIUM}
        />

        <primitive object={heatShimmer} />

        <ChromaticAberration
          offset={chromOffset}
          radialModulation={false}
          modulationOffset={0}
        />

        <Noise opacity={palette.grainIntensity * scale.noise} premultiply />

        <Vignette
          offset={0.22}
          darkness={palette.vignetteDarkness * scale.vignette}
          eskil={false}
        />
      </EffectComposer>
    </>
  );
}

// --- Root component ------------------------------------------------------
function PermianBackgroundInner(props: PermianBackgroundProps) {
  const { effectiveMode } = useTheme();

  const mode: PermianMode = props.forceMode ?? (effectiveMode === 'light' ? 'noon' : 'dusk');
  const palette = useMemo(() => paletteForMode(mode), [mode]);

  // Observe the atmosphere wrapper class to infer fx level. This keeps the
  // Permian theme compatible with the global `fx:cinematic|max` toggle used
  // by other themes without introducing a new hook.
  const [domFxLevel, setDomFxLevel] = useState<PermianFxLevel>('cinematic');
  const wrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (props.forceFxLevel) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const atmo = wrap.closest('.theme-atmo') as HTMLElement | null;
    if (!atmo) return;
    const read = () => setDomFxLevel(atmo.classList.contains('fx-max') ? 'max' : 'cinematic');
    read();
    const obs = new MutationObserver(read);
    obs.observe(atmo, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [props.forceFxLevel]);
  const fxLevel: PermianFxLevel = props.forceFxLevel ?? domFxLevel;

  // Pause the clock when the tab is hidden to save GPU cycles.
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Reduced-motion preference.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (props.forceReducedMotion !== undefined) {
      setReducedMotion(props.forceReducedMotion);
      return;
    }
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mql.matches);
    sync();
    mql.addEventListener?.('change', sync);
    return () => mql.removeEventListener?.('change', sync);
  }, [props.forceReducedMotion]);

  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.setClearColor(new THREE.Color(palette.skyTop), 1);
  }, [palette.skyTop]);

  return (
    <div
      ref={wrapRef}
      className="permian-bg-wrap"
      style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 5], near: 0.01, far: 50, zoom: 1 }}
        dpr={[1, 1.5]}
        frameloop={reducedMotion || paused ? 'demand' : 'always'}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        onCreated={handleCreated}
        style={{ width: '100%', height: '100%' }}
      >
        <OrthographicFitter />
        <ClockPauseController paused={paused} />
        <PermianScene palette={palette} fxLevel={fxLevel} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}

/**
 * Scales the orthographic camera so the scene's world-space height of 1 fills
 * the viewport regardless of aspect ratio.
 */
function OrthographicFitter() {
  const { camera, size } = useThree();
  useEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    const aspect = size.width / size.height;
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 0.5;
    camera.bottom = -0.5;
    camera.near = 0.01;
    camera.far = 50;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

export default function PermianBackground(props: PermianBackgroundProps = {}) {
  const tier = useDeviceTier({ force: props.forceTier });

  if (tier === 'fallback-2d') {
    return (
      <Suspense fallback={null}>
        <OilRigBackground2D mode={props.forceMode} />
      </Suspense>
    );
  }

  return <PermianBackgroundInner {...props} />;
}
