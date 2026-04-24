import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { PermianPalette } from './variants';

/**
 * Derrick — the hero oil rig. Built procedurally to mirror the 2D reference's
 * 17-rung cross-braced tower. Key moving parts:
 *
 *   - Two outer legs taper from wide base to narrow top
 *   - 18 horizontal rungs with two diagonal braces each (X pattern)
 *   - Crown block at top with emissive pulleys
 *   - Traveling block rides up/down on a sinusoidal drill cycle
 *   - Warning strobe on top pulses
 *   - Teal edge-glow on the legs (bloom-ready)
 */

interface DerrickProps {
  /** Center X in world coords (aspect-scaled). */
  worldX: number;
  /** Ground/baseline Y — bottom of the rig sits on this. */
  groundY: number;
  /** Viewport aspect. */
  aspect: number;
  palette: PermianPalette;
  frozen?: boolean;
}

const RUNGS = 18;

export function Derrick({ worldX, groundY, aspect, palette, frozen = false }: DerrickProps) {
  const travelingRef = useRef<THREE.Group>(null);
  const warningRef = useRef<THREE.Mesh>(null);
  const flagRef = useRef<THREE.Mesh>(null);

  const H = 1; // scene height
  const rigH = H * 0.32;
  const rigW = aspect * 2 * 0.055;
  const topY = groundY + rigH;
  const baseLegHalf = rigW * 0.55;
  const topLegHalf = rigW * 0.06;

  // Static structural geometry — build a single BufferGeometry of thin
  // quads for legs + rungs + braces so the whole frame is one draw call.
  const { legsGeom, bracesGeom } = useMemo(() => {
    const legs: number[] = [];
    const braces: number[] = [];

    const addQuad = (bucket: number[], x1: number, y1: number, x2: number, y2: number, thickness: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const nx = -dy / len;
      const ny = dx / len;
      const tx = nx * thickness * 0.5;
      const ty = ny * thickness * 0.5;
      const ax = x1 + tx, ay = y1 + ty;
      const bx = x1 - tx, by = y1 - ty;
      const cx = x2 - tx, cy = y2 - ty;
      const dX = x2 + tx, dY = y2 + ty;
      bucket.push(ax, ay, 0, bx, by, 0, cx, cy, 0, ax, ay, 0, cx, cy, 0, dX, dY, 0);
    };

    // Outer legs (thick)
    const thickLeg = Math.max(rigW * 0.018, 0.002);
    addQuad(legs, -baseLegHalf, 0, -topLegHalf, rigH, thickLeg);
    addQuad(legs, baseLegHalf, 0, topLegHalf, rigH, thickLeg);

    // Inner legs (thinner)
    const thickInner = Math.max(rigW * 0.012, 0.0015);
    addQuad(legs, -baseLegHalf * 0.64, 0, -topLegHalf * 0.67, rigH * 0.9, thickInner);
    addQuad(legs, baseLegHalf * 0.64, 0, topLegHalf * 0.67, rigH * 0.9, thickInner);

    // Horizontal rungs + X-braces
    const thickBrace = Math.max(rigW * 0.0045, 0.0008);
    for (let i = 1; i < RUNGS; i++) {
      const t = i / RUNGS;
      const lx = -baseLegHalf * (1 - t) - topLegHalf * t;
      const rx = baseLegHalf * (1 - t) + topLegHalf * t;
      const y = rigH * t;
      addQuad(braces, lx, y, rx, y, thickBrace);
      if (i < RUNGS - 1) {
        const t2 = (i + 1) / RUNGS;
        const nlx = -baseLegHalf * (1 - t2) - topLegHalf * t2;
        const nrx = baseLegHalf * (1 - t2) + topLegHalf * t2;
        const ny = rigH * t2;
        addQuad(braces, lx, y, nrx, ny, thickBrace * 0.7);
        addQuad(braces, rx, y, nlx, ny, thickBrace * 0.7);
      }
    }

    const legsG = new THREE.BufferGeometry();
    legsG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(legs), 3));
    const bracesG = new THREE.BufferGeometry();
    bracesG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(braces), 3));
    return { legsGeom: legsG, bracesGeom: bracesG };
  }, [aspect, rigH, rigW, baseLegHalf, topLegHalf]);

  // Cables for the traveling-block rig (two cables from crown block down to
  // block). Rebuilt each frame as the block moves.
  const cable1Ref = useRef<THREE.Mesh>(null);
  const cable2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = frozen ? 0 : clock.elapsedTime;

    // Traveling block rides a slow sinusoid (0.3Hz)
    const drillCycle = Math.sin(t * 0.3) * 0.5 + 0.5;
    const tbY = rigH - H * 0.03 - drillCycle * rigH * 0.28;
    if (travelingRef.current) {
      travelingRef.current.position.y = tbY;
    }

    // Warning strobe
    if (warningRef.current) {
      const on = Math.sin(t * 5) > 0.25;
      (warningRef.current.material as THREE.MeshBasicMaterial).opacity = on ? 1 : 0.2;
    }

    // Flag flutter
    if (flagRef.current && !frozen) {
      const fw = Math.sin(t * 3.8) * 0.3 + Math.sin(t * 6) * 0.15;
      flagRef.current.scale.y = 1 + fw * 0.2;
    }

    // Cables update (plane stretched from crown pulley point to traveling block)
    const drawCable = (mesh: THREE.Mesh | null, x1: number, y1: number, x2: number, y2: number) => {
      if (!mesh) return;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
      mesh.rotation.z = ang;
      mesh.scale.set(len, Math.max(rigW * 0.006, 0.0008), 1);
    };
    const cbW = rigW * 0.2;
    drawCable(cable1Ref.current, -cbW * 0.35, rigH, -rigW * 0.03, tbY + H * 0.018);
    drawCable(cable2Ref.current, cbW * 0.35, rigH, rigW * 0.03, tbY + H * 0.018);
  });

  return (
    <group position={[worldX, groundY, 0.03]}>
      {/* Legs + rungs */}
      <mesh>
        <primitive object={legsGeom} attach="geometry" />
        <meshBasicMaterial color={palette.rigSteel} depthWrite={false} />
      </mesh>
      <mesh>
        <primitive object={bracesGeom} attach="geometry" />
        <meshBasicMaterial color={palette.rigDark} depthWrite={false} />
      </mesh>

      {/* Teal edge-glow on outer legs (bloom-ready) */}
      <mesh position={[0, 0, 0.005]}>
        <primitive object={legsGeom} attach="geometry" />
        <meshBasicMaterial
          color={palette.tealGlow}
          transparent
          opacity={0.18 * palette.rigTealIntensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Monkey board */}
      <mesh position={[0, rigH * 0.68, 0.002]}>
        <planeGeometry args={[rigW * 0.6, Math.max(rigH * 0.005, 0.002)]} />
        <meshBasicMaterial color={palette.rigLight} />
      </mesh>

      {/* Crown block */}
      <mesh position={[0, rigH + 0.002, 0.002]}>
        <planeGeometry args={[rigW * 0.4, 0.015]} />
        <meshBasicMaterial color={palette.rigLight} />
      </mesh>
      <mesh position={[-rigW * 0.13, rigH, 0.003]}>
        <circleGeometry args={[rigW * 0.035, 16]} />
        <meshBasicMaterial color={palette.rigDark} />
      </mesh>
      <mesh position={[rigW * 0.13, rigH, 0.003]}>
        <circleGeometry args={[rigW * 0.035, 16]} />
        <meshBasicMaterial color={palette.rigDark} />
      </mesh>

      {/* Cables */}
      <mesh ref={cable1Ref}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={palette.rigCable} />
      </mesh>
      <mesh ref={cable2Ref}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={palette.rigCable} />
      </mesh>

      {/* Traveling block (rides up/down) */}
      <group ref={travelingRef} position={[0, rigH * 0.6, 0.004]}>
        <mesh>
          <planeGeometry args={[rigW * 0.36, 0.018]} />
          <meshBasicMaterial color={palette.rigOrange} />
        </mesh>
        {/* Hook below */}
        <mesh position={[0, -0.015, 0.001]}>
          <planeGeometry args={[0.004, 0.015]} />
          <meshBasicMaterial color={palette.rigDark} />
        </mesh>
      </group>

      {/* Kelly + rig floor */}
      <mesh position={[0, 0.025, 0]}>
        <planeGeometry args={[0.008, 0.04]} />
        <meshBasicMaterial color={palette.rigSteel} />
      </mesh>
      <mesh position={[0, 0.002, 0]}>
        <planeGeometry args={[rigW * 1.2, 0.012]} />
        <meshBasicMaterial color={palette.rigLight} />
      </mesh>

      {/* Warning strobe */}
      <mesh ref={warningRef} position={[0, rigH + 0.012, 0.01]}>
        <circleGeometry args={[0.005, 12]} />
        <meshBasicMaterial color={palette.rigRed} transparent opacity={1} />
      </mesh>

      {/* Orange flag */}
      <mesh ref={flagRef} position={[rigW * 0.1, rigH + 0.004, 0.005]}>
        <planeGeometry args={[rigW * 0.2, 0.012]} />
        <meshBasicMaterial color={palette.rigOrange} transparent opacity={0.95} />
      </mesh>

      {/* Substructure base boxes */}
      <mesh position={[0, -0.018, 0]}>
        <planeGeometry args={[rigW * 1.4, 0.04]} />
        <meshBasicMaterial color={palette.rigDark} />
      </mesh>
    </group>
  );
}
