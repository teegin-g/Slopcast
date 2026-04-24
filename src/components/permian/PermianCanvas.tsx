import { useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { PermianScene } from './PermianScene';
import type { PermianFxLevel, PermianPalette } from './variants';

interface PermianCanvasProps {
  palette: PermianPalette;
  fxLevel: PermianFxLevel;
  reducedMotion: boolean;
  paused: boolean;
}

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

export function PermianCanvas({ palette, fxLevel, reducedMotion, paused }: PermianCanvasProps) {
  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.setClearColor(new THREE.Color(palette.skyTop), 1);
  }, [palette.skyTop]);

  return (
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
  );
}
