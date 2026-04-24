import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { PermianPalette } from './variants';

/**
 * Sky gradient dome. Rendered as a fullscreen plane behind the ridge quads at
 * the far Z plane. A single ShaderMaterial samples a 4-stop vertical gradient
 * (top → horizon) and adds a soft sun-glow halo whose position is driven by
 * the palette. No animation — uniforms update only when the palette changes.
 */
interface SkyDomeProps {
  palette: PermianPalette;
  aspect: number;
  /** Slow cross-fade driver between dusk ↔ noon when the mode toggles. 0..1 */
  modeBlend?: number;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uSkyTop;
  uniform vec3 uSkyMid;
  uniform vec3 uSkyLow;
  uniform vec3 uSkyHorizon;
  uniform vec3 uSunColor;
  uniform vec2 uSunPos;
  uniform float uSunRadius;
  uniform float uAspect;

  void main() {
    float t = 1.0 - vUv.y;
    vec3 c;
    if (t < 0.40) {
      c = mix(uSkyTop, uSkyMid, smoothstep(0.0, 0.40, t));
    } else if (t < 0.75) {
      c = mix(uSkyMid, uSkyLow, smoothstep(0.40, 0.75, t));
    } else {
      c = mix(uSkyLow, uSkyHorizon, smoothstep(0.75, 1.0, t));
    }

    // Soft sun halo baked into the sky (the actual emissive sphere is drawn as
    // a separate mesh so GodRays can target it).
    vec2 px = vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5);
    vec2 sp = vec2((uSunPos.x - 0.5) * uAspect, 0.5 - uSunPos.y);
    float d = distance(px, sp);
    float halo = exp(-pow(d / (uSunRadius * 3.2), 2.0)) * 0.35;
    c += uSunColor * halo;

    gl_FragColor = vec4(c, 1.0);
  }
`;

export function SkyDome({ palette, aspect }: SkyDomeProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uSkyTop: { value: new THREE.Color(palette.skyTop) },
      uSkyMid: { value: new THREE.Color(palette.skyMid) },
      uSkyLow: { value: new THREE.Color(palette.skyLow) },
      uSkyHorizon: { value: new THREE.Color(palette.skyHorizon) },
      uSunColor: { value: new THREE.Color(palette.sun) },
      uSunPos: { value: new THREE.Vector2(palette.sunX, palette.sunY) },
      uSunRadius: { value: palette.sunRadius },
      uAspect: { value: aspect },
    }),
    // Eager-init only; runtime updates flow through useFrame below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame(() => {
    const m = matRef.current;
    if (!m) return;
    (m.uniforms.uSkyTop.value as THREE.Color).set(palette.skyTop);
    (m.uniforms.uSkyMid.value as THREE.Color).set(palette.skyMid);
    (m.uniforms.uSkyLow.value as THREE.Color).set(palette.skyLow);
    (m.uniforms.uSkyHorizon.value as THREE.Color).set(palette.skyHorizon);
    (m.uniforms.uSunColor.value as THREE.Color).set(palette.sun);
    (m.uniforms.uSunPos.value as THREE.Vector2).set(palette.sunX, palette.sunY);
    m.uniforms.uSunRadius.value = palette.sunRadius;
    m.uniforms.uAspect.value = aspect;
  });

  return (
    <mesh position={[0, 0, -10]} renderOrder={-100}>
      <planeGeometry args={[aspect * 2.2, 1.2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
