import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type { PermianPalette } from './variants';

/**
 * Frac spread — pump trucks + sand kings + blender + data van + treating
 * iron. Placed to the LEFT of the main derrick, connected by a visible hose
 * to the wellhead. Uses planes for silhouettes and GPU-particle Sparkles for
 * exhaust plumes.
 *
 * Geometry mirrors the 2D reference's 4-pump layout with each truck carrying
 * a pump housing and exhaust stack.
 */

interface FracSpreadProps {
  /** X center in world coords (aspect-scaled). */
  worldX: number;
  /** Ground baseline Y. */
  groundY: number;
  aspect: number;
  palette: PermianPalette;
  frozen?: boolean;
}

const TRUCK_COUNT = 4;

export function FracSpread({ worldX, groundY, aspect, palette, frozen = false }: FracSpreadProps) {
  const flareRef = useRef<THREE.Mesh>(null);
  const W = aspect * 2;
  const H = 1;

  const truckW = W * 0.028;
  const truckH = H * 0.022;

  const trucks = useMemo(
    () => Array.from({ length: TRUCK_COUNT }, (_, i) => ({
      x: -W * 0.07 + i * W * 0.035 + truckW * 0.5,
      i,
    })),
    [W, truckW],
  );

  useFrame(({ clock }) => {
    if (frozen) return;
    if (flareRef.current) {
      const flicker = 0.75 + Math.sin(clock.elapsedTime * 12) * 0.1 + Math.sin(clock.elapsedTime * 27) * 0.08;
      flareRef.current.scale.y = flicker;
      (flareRef.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * palette.flareIntensity * flicker;
    }
  });

  const sparkleColor = useMemo(() => new THREE.Color('#8a9898'), []);

  return (
    <group position={[worldX, groundY, 0.025]}>
      {/* Frac pad */}
      <mesh position={[0, -H * 0.008, -0.001]}>
        <planeGeometry args={[W * 0.2, H * 0.02]} />
        <meshBasicMaterial color={palette.padColor} />
      </mesh>

      {/* Pump trucks */}
      {trucks.map((t, i) => (
        <group key={i} position={[t.x, 0, 0]}>
          {/* Truck body */}
          <mesh position={[0, truckH * 0.5, 0]}>
            <planeGeometry args={[truckW, truckH]} />
            <meshBasicMaterial color={palette.fracTruck} />
          </mesh>
          {/* Pump housing */}
          <mesh position={[-truckW * 0.1, truckH + truckH * 0.15, 0.001]}>
            <planeGeometry args={[truckW * 0.65, truckH * 0.3]} />
            <meshBasicMaterial color={'#822818'} />
          </mesh>
          {/* Cab */}
          <mesh position={[-truckW * 0.55, truckH * 0.35, 0.001]}>
            <planeGeometry args={[truckW * 0.2, truckH * 0.7]} />
            <meshBasicMaterial color={palette.fracTruck} />
          </mesh>
          {/* Windshield */}
          <mesh position={[-truckW * 0.55, truckH * 0.55, 0.002]}>
            <planeGeometry args={[truckW * 0.14, truckH * 0.25]} />
            <meshBasicMaterial color={'#8ac8ee'} transparent opacity={0.45} />
          </mesh>
          {/* Wheels */}
          <mesh position={[-truckW * 0.3, 0, 0.002]}>
            <circleGeometry args={[truckH * 0.12, 12]} />
            <meshBasicMaterial color={'#1a1a1a'} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <circleGeometry args={[truckH * 0.12, 12]} />
            <meshBasicMaterial color={'#1a1a1a'} />
          </mesh>
          <mesh position={[truckW * 0.3, 0, 0.002]}>
            <circleGeometry args={[truckH * 0.12, 12]} />
            <meshBasicMaterial color={'#1a1a1a'} />
          </mesh>
          {/* Exhaust stack */}
          <mesh position={[truckW * 0.35, truckH + truckH * 0.5, 0.001]}>
            <planeGeometry args={[truckW * 0.04, truckH * 0.5]} />
            <meshBasicMaterial color={palette.rigDark} />
          </mesh>
          {/* GPU exhaust particles */}
          {!frozen && i % 2 === 0 && (
            <Sparkles
              count={8}
              scale={[truckW * 0.3, truckH * 1.4, 0.02]}
              position={[truckW * 0.37, truckH + truckH * 1.2, 0.002]}
              size={4}
              speed={0.4}
              opacity={0.18}
              color={sparkleColor}
              noise={1}
            />
          )}
        </group>
      ))}

      {/* Missile / blender tower */}
      <group position={[W * 0.04, 0, 0]}>
        <mesh position={[0, H * 0.02, 0]}>
          <planeGeometry args={[W * 0.02, H * 0.04]} />
          <meshBasicMaterial color={palette.fracTrailer} />
        </mesh>
        {/* Hopper on top */}
        <mesh position={[0, H * 0.046, 0.001]}>
          <planeGeometry args={[W * 0.023, H * 0.012]} />
          <meshBasicMaterial color={palette.rigLight} />
        </mesh>
      </group>

      {/* Sand kings (proppant storage — 3 containers) */}
      {Array.from({ length: 3 }, (_, i) => (
        <group key={`sk-${i}`} position={[-W * 0.095 + i * W * 0.028, H * 0.014, 0]}>
          <mesh>
            <planeGeometry args={[W * 0.022, H * 0.028]} />
            <meshBasicMaterial color={i === 1 ? '#e0d8c0' : '#d8d0b8'} />
          </mesh>
          {/* Blue label stripe */}
          <mesh position={[0, H * 0.005, 0.001]}>
            <planeGeometry args={[W * 0.022, H * 0.005]} />
            <meshBasicMaterial color={'#1e4a80'} transparent opacity={0.45} />
          </mesh>
        </group>
      ))}

      {/* Frac water tanks (2) */}
      {Array.from({ length: 2 }, (_, i) => (
        <mesh key={`ft-${i}`} position={[W * 0.065 + i * W * 0.025, H * 0.01, 0]}>
          <planeGeometry args={[W * 0.02, H * 0.02]} />
          <meshBasicMaterial color={palette.fracTank} />
        </mesh>
      ))}

      {/* Treating iron manifold (horizontal hose) */}
      <mesh position={[0, -H * 0.005, 0.001]}>
        <planeGeometry args={[W * 0.12, H * 0.003]} />
        <meshBasicMaterial color={palette.fracPipe} />
      </mesh>
      {/* Hose to wellhead (diagonal) */}
      <mesh position={[W * 0.08, -H * 0.005, 0.001]} rotation={[0, 0, -0.2]}>
        <planeGeometry args={[W * 0.1, H * 0.0025]} />
        <meshBasicMaterial color={palette.fracHose} />
      </mesh>

      {/* Data van */}
      <group position={[W * 0.06, H * 0.009, 0]}>
        <mesh>
          <planeGeometry args={[W * 0.025, H * 0.018]} />
          <meshBasicMaterial color={'#e8e0d0'} />
        </mesh>
        {/* Blue stripe */}
        <mesh position={[0, H * 0.007, 0.001]}>
          <planeGeometry args={[W * 0.025, H * 0.004]} />
          <meshBasicMaterial color={'#2868b0'} />
        </mesh>
      </group>

      {/* Flare stack flame (on first truck, visible in dusk) */}
      <mesh
        ref={flareRef}
        position={[trucks[0].x + truckW * 0.2, truckH + H * 0.014, 0.003]}
      >
        <planeGeometry args={[W * 0.006, H * 0.028]} />
        <meshBasicMaterial color={palette.rigOrange} transparent opacity={0.8 * palette.flareIntensity} />
      </mesh>
    </group>
  );
}
