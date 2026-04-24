import * as THREE from 'three';
import { useMemo } from 'react';
import { hillY, RIDGE_LAYERS } from './hillNoise';
import type { PermianPalette } from './variants';

/**
 * Parallax ridges built as closed 2D Shapes so the silhouettes match the 2D
 * reference pixel-for-pixel. Each ridge gets:
 *   - A filled Shape with ridge color + per-layer opacity blend toward sky
 *   - A top-edge line-mesh in teal for the glow (blends additively via Bloom)
 *
 * All ridges are flat on the XY plane; parallax depth is fake (z is purely a
 * render-order hint). No displacement shaders needed — this mirrors the 2D
 * scene's layered-opacity approach.
 */

interface TerrainProps {
  palette: PermianPalette;
  /** Viewport aspect (width / height). Scene height = 1, width = aspect. */
  aspect: number;
}

const SEGMENTS = 160;

function buildRidgePoints(seed: number, amp: number, baselineY3d: number, halfWidth: number) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const u = i / SEGMENTS;
    const x = -halfWidth + u * halfWidth * 2;
    const dy = hillY(seed, u, amp);
    const y = baselineY3d - dy; // peaks up
    pts.push(new THREE.Vector2(x, y));
  }
  return pts;
}

function buildFilledGeometry(pts: THREE.Vector2[], halfWidth: number, bottomY: number) {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].y);
  shape.lineTo(halfWidth, bottomY);
  shape.lineTo(-halfWidth, bottomY);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function buildEdgeGeometry(pts: THREE.Vector2[]) {
  const positions = new Float32Array(pts.length * 3);
  for (let i = 0; i < pts.length; i++) {
    positions[i * 3 + 0] = pts[i].x;
    positions[i * 3 + 1] = pts[i].y;
    positions[i * 3 + 2] = 0;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geom;
}

interface RidgeProps {
  seed: number;
  amp: number;
  baselineY3d: number;
  halfWidth: number;
  bottomY: number;
  color: string;
  opacity: number;
  glowColor: string;
  glowAlpha: number;
  z: number;
}

function Ridge({
  seed,
  amp,
  baselineY3d,
  halfWidth,
  bottomY,
  color,
  opacity,
  glowColor,
  glowAlpha,
  z,
}: RidgeProps) {
  const points = useMemo(
    () => buildRidgePoints(seed, amp, baselineY3d, halfWidth),
    [seed, amp, baselineY3d, halfWidth],
  );
  const fillGeom = useMemo(
    () => buildFilledGeometry(points, halfWidth, bottomY),
    [points, halfWidth, bottomY],
  );
  const edgeGeom = useMemo(() => buildEdgeGeometry(points), [points]);

  return (
    <group position={[0, 0, z]}>
      <mesh geometry={fillGeom}>
        <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
      </mesh>
      {glowAlpha > 0.001 && (
        <line>
          <primitive object={edgeGeom} attach="geometry" />
          <lineBasicMaterial
            color={glowColor}
            transparent
            opacity={glowAlpha}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </line>
      )}
    </group>
  );
}

export function Terrain({ palette, aspect }: TerrainProps) {
  const halfWidth = aspect;
  const bottomY = -0.5;

  return (
    <group>
      {RIDGE_LAYERS.map((layer, i) => {
        const baselineY3d = 0.5 - layer.y;
        return (
          <Ridge
            key={layer.name}
            seed={layer.seed}
            amp={layer.amp}
            baselineY3d={baselineY3d}
            halfWidth={halfWidth}
            bottomY={bottomY}
            color={palette.ridgeColors[i]}
            opacity={palette.ridgeOpacity[i]}
            glowColor={palette.ridgeGlow}
            glowAlpha={palette.ridgeGlowAlpha[i]}
            z={-0.9 + i * 0.02}
          />
        );
      })}
      {/* Ground fill below last ridge */}
      <mesh position={[0, -0.295, -0.75]} renderOrder={-1}>
        <planeGeometry args={[halfWidth * 2.05, 0.42]} />
        <meshBasicMaterial color={palette.groundBottom} depthWrite={false} />
      </mesh>
    </group>
  );
}
