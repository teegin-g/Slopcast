import { useEffect, useMemo, type RefObject } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BlendFunction, KernelSize } from 'postprocessing';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  GodRays,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { HeatShimmerEffect } from './HeatShimmerEffect';
import type { PermianFxLevel, PermianPalette } from './variants';

const FX_SCALE: Record<PermianFxLevel, { bloom: number; godRays: number; noise: number; vignette: number; shimmer: number }> = {
  cinematic: { bloom: 1, godRays: 1, noise: 1, vignette: 1, shimmer: 1 },
  max: { bloom: 1.4, godRays: 1.3, noise: 1.3, vignette: 1.1, shimmer: 1.25 },
};

interface PermianPostFxProps {
  palette: PermianPalette;
  fxLevel: PermianFxLevel;
  reducedMotion: boolean;
  sunRef: RefObject<THREE.Mesh | null>;
}

export function PermianPostFx({ palette, fxLevel, reducedMotion, sunRef }: PermianPostFxProps) {
  const heatShimmer = useMemo(() => new HeatShimmerEffect({ amplitude: 0, cutoff: 0.42, speed: 1.1 }), []);
  useEffect(() => () => heatShimmer.dispose(), [heatShimmer]);

  const scale = FX_SCALE[fxLevel];
  const targetShimmer = palette.heatShimmerAmplitude * scale.shimmer * (reducedMotion ? 0 : 1);
  useFrame(() => {
    const current = heatShimmer.amplitude;
    heatShimmer.amplitude = current + (targetShimmer - current) * 0.05;
  });

  const chromOffset = useMemo(() => new THREE.Vector2(0.0004, 0.0006), []);

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <GodRays
        sun={sunRef as RefObject<THREE.Mesh>}
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
  );
}
