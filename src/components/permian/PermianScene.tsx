import { useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Derrick } from './Derrick';
import { FracSpread } from './FracSpread';
import { RIDGE_LAYERS, hillY } from './hillNoise';
import { PermianPostFx } from './PermianPostFx';
import { Pumpjacks } from './Pumpjack';
import { SkyDome } from './SkyDome';
import { Trees, Workers } from './Sprites';
import { Terrain } from './Terrain';
import type { PermianFxLevel, PermianPalette } from './variants';

interface SunMeshProps {
  palette: PermianPalette;
  aspect: number;
  meshRef: RefObject<THREE.Mesh | null>;
}

function useViewportAspect(): number {
  const { viewport } = useThree();
  return viewport.width / viewport.height;
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

interface PermianSceneProps {
  palette: PermianPalette;
  fxLevel: PermianFxLevel;
  reducedMotion: boolean;
}

export function PermianScene({ palette, fxLevel, reducedMotion }: PermianSceneProps) {
  const aspect = useViewportAspect();
  const sunRef = useRef<THREE.Mesh | null>(null);

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

      <PermianPostFx
        palette={palette}
        fxLevel={fxLevel}
        reducedMotion={reducedMotion}
        sunRef={sunRef}
      />
    </>
  );
}
