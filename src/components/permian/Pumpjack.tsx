import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { hillY, RIDGE_LAYERS, PUMPJACK_SLOTS, type PumpjackSlot } from './hillNoise';
import type { PermianPalette } from './variants';

/**
 * Pumpjack — articulated 4-bar linkage animated in sync with the reference
 * scene's rocking motion. Built from flat extruded planes so the silhouette
 * reads at every distance. Each pumpjack:
 *
 *   - samson post stands at the hillY ground point for its slot
 *   - walking beam pivots at the post top with angle = sin(t*0.8 + phase)*0.35
 *   - horse-head linear stub follows the head end of the beam
 *   - crank + pitman arm close the 4-bar loop (crankAngle = t*0.8 + phase)
 *
 * The animation parameters are lifted directly from the 2D reference so the
 * two implementations stay visually consistent.
 */

interface PumpjackProps {
  slot: PumpjackSlot;
  aspect: number;
  palette: PermianPalette;
  /** If true, freeze at mid-stroke (used for reduced-motion). */
  frozen?: boolean;
}

/**
 * Pitman arm — a rotating plane whose length and angle update every frame to
 * connect the rotating crank-end to the rocking beam-tail.
 */
function useDynamicBar(thickness: number) {
  const ref = useRef<THREE.Mesh>(null);
  const update = (fromX: number, fromY: number, toX: number, toY: number) => {
    const m = ref.current;
    if (!m) return;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    m.position.set((fromX + toX) / 2, (fromY + toY) / 2, m.position.z);
    m.rotation.z = angle;
    m.scale.set(length, thickness, 1);
  };
  return { ref, update };
}

export function Pumpjack({ slot, aspect, palette, frozen = false }: PumpjackProps) {
  const groupRef = useRef<THREE.Group>(null);
  const rockRef = useRef<THREE.Group>(null);
  const crankRef = useRef<THREE.Group>(null);

  const ridge = RIDGE_LAYERS.find(r => r.name === slot.ridge)!;
  const halfWidth = aspect;
  const worldX = -halfWidth + slot.xNorm * halfWidth * 2;
  const worldY = 0.5 - (ridge.y + hillY(ridge.seed, slot.xNorm, ridge.amp));

  const unit = halfWidth * 2 * 0.012 * slot.scale;
  const beamLen = unit * 3.5;
  const postHeight = unit * 3;
  const crankR = unit * 0.6;
  const crankCx = -unit * 0.8;
  const crankCy = -unit * 0.5;

  const pitman = useDynamicBar(Math.max(unit * 0.1, 0.0015));
  const headStub = useDynamicBar(Math.max(unit * 0.14, 0.002));
  const bridle = useDynamicBar(Math.max(unit * 0.05, 0.0012));

  // Frozen snapshot — used when useFrame is not ticking.
  const frozenRock = useMemo(() => {
    if (!frozen) return 0;
    const t = slot.phase * 0.5;
    return Math.sin(t * 0.8 + slot.phase) * 0.35;
  }, [frozen, slot.phase]);

  const headRadius = Math.max(unit * 0.14, 0.002);

  useFrame(({ clock }) => {
    if (frozen) return;
    if (!rockRef.current || !crankRef.current) return;
    const t = clock.elapsedTime;
    const rockAngle = Math.sin(t * 0.8 + slot.phase) * 0.35;
    rockRef.current.rotation.z = rockAngle;
    const crankAngle = t * 0.8 + slot.phase;
    crankRef.current.rotation.z = crankAngle;

    const crankEndX = crankCx + Math.cos(crankAngle) * crankR;
    const crankEndY = crankCy + Math.sin(crankAngle) * crankR;
    const pivotY = postHeight - unit * 0.4;
    const tailX = -Math.cos(rockAngle) * beamLen * 0.45;
    const tailY = pivotY - Math.sin(rockAngle) * beamLen * 0.45;

    pitman.update(crankEndX, crankEndY, tailX, tailY);

    const headX = Math.cos(rockAngle) * beamLen * 0.55;
    const headY = pivotY + Math.sin(rockAngle) * beamLen * 0.55;
    const headCurveX = headX + Math.cos(rockAngle + 0.3) * unit * 0.8;
    const headCurveY = headY + Math.sin(rockAngle + 0.3) * unit * 0.8;
    headStub.update(headX, headY, headCurveX, headCurveY);
    bridle.update(headCurveX, headCurveY, headCurveX - unit * 0.2, 0);
  });

  return (
    <group ref={groupRef} position={[worldX, worldY, 0.02]}>
      {/* A-frame base */}
      <mesh position={[0, unit * 0.2, 0]}>
        <planeGeometry args={[unit * 3.6, unit * 0.4]} />
        <meshBasicMaterial color={palette.rigSteel} />
      </mesh>

      {/* Samson post */}
      <mesh position={[0, (postHeight - unit * 0.4) / 2 + unit * 0.4, 0]}>
        <planeGeometry args={[Math.max(unit * 0.18, 0.002), postHeight - unit * 0.4]} />
        <meshBasicMaterial color={palette.rigSteel} />
      </mesh>

      {/* Walking beam — rocks */}
      <group
        ref={rockRef}
        position={[0, postHeight - unit * 0.4, 0]}
        rotation={[0, 0, frozenRock]}
      >
        <mesh position={[beamLen * 0.05, 0, 0]}>
          <planeGeometry args={[beamLen * 1.1, Math.max(unit * 0.15, 0.002)]} />
          <meshBasicMaterial color={palette.rigSteel} />
        </mesh>
        {/* Counterweight */}
        <mesh position={[-beamLen * 0.45, 0, 0.001]}>
          <circleGeometry args={[unit * 0.35, 24]} />
          <meshBasicMaterial color={palette.rigLight} />
        </mesh>
        <mesh position={[-beamLen * 0.45, 0, 0.002]}>
          <circleGeometry args={[unit * 0.22, 20]} />
          <meshBasicMaterial color={palette.rigDark} />
        </mesh>
      </group>

      {/* Pivot bearing */}
      <mesh position={[0, postHeight - unit * 0.4, 0.003]}>
        <circleGeometry args={[unit * 0.18, 20]} />
        <meshBasicMaterial color={palette.rigLight} />
      </mesh>

      {/* Horse-head stub (dynamic) */}
      <mesh ref={headStub.ref}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={palette.rigDark} />
      </mesh>
      {/* Horse-head cap disc at curve tip (static shape; tip position follows via bridle) */}
      <mesh position={[0, 0, 0.004]}>
        <circleGeometry args={[headRadius, 12]} />
        <meshBasicMaterial color={palette.rigDark} transparent opacity={0} />
      </mesh>

      {/* Bridle (dynamic thin plane) */}
      <mesh ref={bridle.ref}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={palette.rigCable} />
      </mesh>

      {/* Crank wheel */}
      <group ref={crankRef} position={[crankCx, crankCy, 0]}>
        <mesh>
          <ringGeometry args={[crankR * 0.88, crankR, 24]} />
          <meshBasicMaterial color={palette.rigSteel} />
        </mesh>
        <mesh position={[crankR * 0.5, 0, 0.001]}>
          <planeGeometry args={[crankR, Math.max(unit * 0.1, 0.0015)]} />
          <meshBasicMaterial color={palette.rigSteel} />
        </mesh>
      </group>
      <mesh position={[crankCx, crankCy, 0.005]}>
        <circleGeometry args={[Math.max(unit * 0.1, 0.002), 16]} />
        <meshBasicMaterial color={palette.rigDark} />
      </mesh>

      {/* Pitman arm (dynamic) */}
      <mesh ref={pitman.ref}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={palette.rigDark} />
      </mesh>

      {/* Prime mover (motor) */}
      <mesh position={[crankCx, crankCy + crankR * 0.75, 0]}>
        <planeGeometry args={[unit * 1.0, unit * 0.5]} />
        <meshBasicMaterial color={palette.rigSteel} />
      </mesh>

      {/* Wellhead stub */}
      <mesh position={[0, unit * 0.05, 0.001]}>
        <planeGeometry args={[unit * 0.6, unit * 0.2]} />
        <meshBasicMaterial color={palette.rigSteel} />
      </mesh>
    </group>
  );
}

export function Pumpjacks({
  palette,
  aspect,
  frozen,
}: {
  palette: PermianPalette;
  aspect: number;
  frozen?: boolean;
}) {
  return (
    <group>
      {PUMPJACK_SLOTS.map((slot, i) => (
        <Pumpjack key={i} slot={slot} aspect={aspect} palette={palette} frozen={frozen} />
      ))}
    </group>
  );
}
