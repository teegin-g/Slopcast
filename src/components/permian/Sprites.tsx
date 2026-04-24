import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { PermianPalette } from './variants';

/**
 * Workers + trees — mostly flat plane silhouettes with a little vertex-shader
 * motion. We skip texture atlases and instead build everything from simple
 * primitives so there are zero image assets to ship.
 *
 * Workers: 6-8 small figures clustered near the derrick and frac spread.
 * Hardhats tint orange (crew A) or white (crew B). Arms + legs swing via
 * sin(t).
 *
 * Trees: left / right framing trees built from a trunk rectangle + three
 * canopy ellipses. A vertex-shader-free sway is faked by rotating the whole
 * canopy group very slightly around its base.
 */

interface Props {
  worldX: number;
  groundY: number;
  aspect: number;
  palette: PermianPalette;
  frozen?: boolean;
}

interface WorkerDef {
  bx: number;
  by: number;
  range: number;
  phase: number;
  spd: number;
  col: 0 | 1;
}

const WORKER_LAYOUT: WorkerDef[] = [
  { bx: 0.455, by: 0.72, range: 0.012, phase: 0.0, spd: 0.45, col: 0 },
  { bx: 0.545, by: 0.715, range: 0.01, phase: 1.6, spd: 0.6, col: 1 },
  { bx: 0.42, by: 0.73, range: 0.018, phase: 3.0, spd: 0.4, col: 0 },
  { bx: 0.575, by: 0.725, range: 0.008, phase: 4.5, spd: 0.55, col: 1 },
  { bx: 0.30, by: 0.72, range: 0.01, phase: 0.5, spd: 0.5, col: 0 },
  { bx: 0.265, by: 0.725, range: 0.008, phase: 2.0, spd: 0.6, col: 1 },
  { bx: 0.335, by: 0.73, range: 0.012, phase: 3.8, spd: 0.45, col: 0 },
  { bx: 0.50, by: 0.735, range: 0.005, phase: 2.2, spd: 0.3, col: 0 },
];

interface TreeDef {
  x: number; // norm 0..1
  y: number; // norm 0..1 (ground)
  h: number;
  w: number;
  trunk: number;
  far?: boolean;
  fg?: boolean;
}

const TREE_LAYOUT: TreeDef[] = [
  { x: 0.04, y: 0.66, h: 0.10, w: 0.06, trunk: 0.012 },
  { x: 0.08, y: 0.67, h: 0.08, w: 0.05, trunk: 0.010 },
  { x: 0.12, y: 0.665, h: 0.09, w: 0.055, trunk: 0.011 },
  { x: 0.02, y: 0.68, h: 0.06, w: 0.04, trunk: 0.008 },
  { x: 0.78, y: 0.665, h: 0.09, w: 0.055, trunk: 0.011 },
  { x: 0.83, y: 0.67, h: 0.07, w: 0.045, trunk: 0.009 },
  { x: 0.88, y: 0.66, h: 0.10, w: 0.06, trunk: 0.012 },
  { x: 0.93, y: 0.675, h: 0.065, w: 0.042, trunk: 0.008 },
  { x: 0.97, y: 0.67, h: 0.08, w: 0.05, trunk: 0.010 },
  { x: 0.15, y: 0.60, h: 0.04, w: 0.03, trunk: 0.005, far: true },
  { x: 0.30, y: 0.59, h: 0.035, w: 0.028, trunk: 0.004, far: true },
  { x: 0.68, y: 0.595, h: 0.038, w: 0.030, trunk: 0.005, far: true },
  { x: 0.75, y: 0.60, h: 0.033, w: 0.025, trunk: 0.004, far: true },
  { x: -0.01, y: 0.78, h: 0.16, w: 0.09, trunk: 0.018, fg: true },
  { x: 0.96, y: 0.80, h: 0.18, w: 0.10, trunk: 0.020, fg: true },
];

function Tree({ def, aspect, palette, frozen }: { def: TreeDef; aspect: number; palette: PermianPalette; frozen?: boolean }) {
  const canopyRef = useRef<THREE.Group>(null);
  const W = aspect * 2;
  const H = 1;
  const x = -aspect + def.x * W;
  const baseY = 0.5 - def.y;
  const h = def.h * H;
  const w = def.w * W;
  const trunkW = def.trunk * W;
  const trunkH = h * 0.4;
  const canopyBaseY = baseY + trunkH * 0.6;

  useFrame(({ clock }) => {
    if (!canopyRef.current || frozen) return;
    const baseSway = Math.sin(clock.elapsedTime * 0.5 + def.x * 10) * 0.015 * (def.fg ? 1.5 : def.far ? 0.3 : 1);
    canopyRef.current.rotation.z = baseSway;
  });

  const trunkColor = def.fg ? '#0a2010' : def.far ? '#1a4025' : palette.treeTrunk;
  const layers: { color: string; oy: number; rw: number; rh: number }[] = def.far
    ? [
        { color: '#1a6040', oy: -0.55, rw: 0.5, rh: 0.35 },
        { color: '#1a7048', oy: -0.7, rw: 0.4, rh: 0.30 },
      ]
    : def.fg
    ? [
        { color: palette.treeLeafDark, oy: -0.4, rw: 0.55, rh: 0.40 },
        { color: '#082818', oy: -0.55, rw: 0.50, rh: 0.38 },
        { color: '#061a10', oy: -0.7, rw: 0.45, rh: 0.35 },
        { color: '#0a3020', oy: -0.85, rw: 0.35, rh: 0.28 },
      ]
    : [
        { color: palette.treeLeafDark, oy: -0.4, rw: 0.45, rh: 0.32 },
        { color: palette.treeLeafMid, oy: -0.5, rw: 0.48, rh: 0.34 },
        { color: palette.treeLeafDark, oy: -0.6, rw: 0.50, rh: 0.36 },
        { color: palette.treeLeafMid, oy: -0.72, rw: 0.42, rh: 0.30 },
        { color: palette.treeLeafLight, oy: -0.82, rw: 0.32, rh: 0.24 },
      ];

  return (
    <group position={[x, 0, def.fg ? 0.06 : def.far ? 0.005 : 0.04]}>
      {/* Trunk */}
      <mesh position={[0, baseY + trunkH / 2, 0]}>
        <planeGeometry args={[trunkW, trunkH]} />
        <meshBasicMaterial color={trunkColor} />
      </mesh>
      {/* Canopy ellipses */}
      <group ref={canopyRef} position={[0, canopyBaseY, 0]}>
        {layers.map((l, i) => (
          <mesh key={i} position={[0, -l.oy * h, i * 0.0005]} scale={[l.rw * w, l.rh * h, 1]}>
            <circleGeometry args={[1, 22]} />
            <meshBasicMaterial color={l.color} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Worker({
  worker,
  aspect,
  palette,
  frozen,
}: {
  worker: WorkerDef;
  aspect: number;
  palette: PermianPalette;
  frozen?: boolean;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Mesh>(null);
  const armRRef = useRef<THREE.Mesh>(null);
  const legLRef = useRef<THREE.Mesh>(null);
  const legRRef = useRef<THREE.Mesh>(null);

  const W = aspect * 2;
  const baseX = -aspect + worker.bx * W;
  const baseY = 0.5 - worker.by;
  const wh = 0.02;
  const ww = wh * 0.4;

  useFrame(({ clock }) => {
    if (frozen || !rootRef.current) return;
    const t = clock.elapsedTime;
    const xOff = Math.sin(t * worker.spd + worker.phase) * worker.range * W;
    rootRef.current.position.x = baseX + xOff;
    const ls = Math.sin(t * worker.spd * 3 + worker.phase) * 0.16;
    const as = Math.sin(t * 2 + worker.phase) * 0.22;
    if (legLRef.current) legLRef.current.rotation.z = ls;
    if (legRRef.current) legRRef.current.rotation.z = -ls;
    if (armLRef.current) armLRef.current.rotation.z = as;
    if (armRRef.current) armRRef.current.rotation.z = -as;
  });

  const shirtColor = worker.col === 0 ? palette.coverRed : palette.coverBlue;
  const hatColor = worker.col === 0 ? palette.hatYellow : palette.hatWhite;

  return (
    <group ref={rootRef} position={[baseX, baseY, 0.05]}>
      {/* Legs */}
      <mesh ref={legLRef} position={[-ww * 0.12, -wh * 0.2, 0]}>
        <planeGeometry args={[ww * 0.28, wh * 0.4]} />
        <meshBasicMaterial color={'#2a3848'} />
      </mesh>
      <mesh ref={legRRef} position={[ww * 0.12, -wh * 0.2, 0]}>
        <planeGeometry args={[ww * 0.28, wh * 0.4]} />
        <meshBasicMaterial color={'#2a3848'} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, wh * 0.1, 0.001]}>
        <planeGeometry args={[ww * 0.56, wh * 0.4]} />
        <meshBasicMaterial color={shirtColor} />
      </mesh>
      {/* Arms */}
      <mesh ref={armLRef} position={[-ww * 0.35, wh * 0.1, 0.001]}>
        <planeGeometry args={[ww * 0.22, wh * 0.38]} />
        <meshBasicMaterial color={shirtColor} />
      </mesh>
      <mesh ref={armRRef} position={[ww * 0.35, wh * 0.1, 0.001]}>
        <planeGeometry args={[ww * 0.22, wh * 0.38]} />
        <meshBasicMaterial color={shirtColor} />
      </mesh>
      {/* Head */}
      <mesh position={[0, wh * 0.35, 0.002]}>
        <circleGeometry args={[wh * 0.08, 12]} />
        <meshBasicMaterial color={'#d0b090'} />
      </mesh>
      {/* Hardhat */}
      <mesh position={[0, wh * 0.42, 0.003]}>
        <planeGeometry args={[wh * 0.2, wh * 0.1]} />
        <meshBasicMaterial color={hatColor} />
      </mesh>
    </group>
  );
}

export function Workers({ aspect, palette, frozen }: { aspect: number; palette: PermianPalette; frozen?: boolean }) {
  return (
    <group>
      {WORKER_LAYOUT.map((w, i) => (
        <Worker key={i} worker={w} aspect={aspect} palette={palette} frozen={frozen} />
      ))}
    </group>
  );
}

export function Trees({ aspect, palette, frozen }: { aspect: number; palette: PermianPalette; frozen?: boolean }) {
  return (
    <group>
      {TREE_LAYOUT.map((t, i) => (
        <Tree key={i} def={t} aspect={aspect} palette={palette} frozen={frozen} />
      ))}
    </group>
  );
}
