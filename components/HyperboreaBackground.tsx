/**
 * HyperboreaBackground – animated HTML5 Canvas backdrop for the 'hyperborea' theme.
 *
 * Renders a winter village synthwave/hyperborea scene:
 *   - Cold grey/deep blue sky with falling snow
 *   - The user-provided sun graphic spinning in the center
 *   - Nordic homes (geometric village silhouettes) with glowing amber windows
 *   - Wooly mammoths slowly drifting/walking in the foreground
 *   - Distant icy mountains
 *   - Ground layer of snow with subtle gradients
 *
 * Positioned as a fixed full-viewport layer behind all content (z-index: -1).
 */
import { useEffect, useRef } from 'react';

const TAU = Math.PI * 2;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function fract(v: number) {
  return v - Math.floor(v);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// ── Color palette (icy grey/blue + warm amber accents) ────────────
const COLORS = {
  skyTop: '#0b1320',
  skyMid: '#162338',
  skyLow: '#203450',
  horizon: '#2c4365',
  snowGround: '#8f9fb8',
  snowDark: '#5a6c87',
  mountainFar: '#1c2e48',
  mountainNear: '#233959',
  villageSil: '#141d2e',
  windowGlow: '#fbbc05',
  mammothBody: '#0f1725',
  mammothTusk: '#cbd5e1',
};

// ── Deterministic pseudo-random (for consistent layout) ─────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

// ── Falling Snow (two deterministic layers) ──────────────────────────────
type SnowParticle = {
  x: number; // normalized
  y: number; // normalized
  r: number; // px
  vy: number; // normalized units / sec
  vx: number; // normalized units / sec
  phase: number;
};

function generateSnowLayer(opts: {
  seed: number;
  count: number;
  rMin: number;
  rMax: number;
  vyMin: number;
  vyMax: number;
  vxMin: number;
  vxMax: number;
}) {
  const rand = seededRandom(opts.seed);
  const snow: SnowParticle[] = [];
  for (let i = 0; i < opts.count; i++) {
    snow.push({
      x: rand(),
      y: rand(),
      r: lerp(opts.rMin, opts.rMax, rand()),
      vy: lerp(opts.vyMin, opts.vyMax, rand()),
      vx: lerp(opts.vxMin, opts.vxMax, rand()),
      phase: rand() * TAU,
    });
  }
  return snow;
}

// ── Mountains ──────────────────────────────────────────────────────────
function generateMountains(seed: number, points: number, amp: number) {
  const rand = seededRandom(seed);
  const peaks: number[] = [];
  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    const distFromCenter = Math.abs(progress - 0.5);
    
    // Create a valley in the middle (0 at center, 1 at edges)
    const envelope = Math.min(1, distFromCenter / 0.35);
    const smoothEnvelope = envelope * envelope * (3 - 2 * envelope);
    
    const baseHeight = smoothEnvelope * amp * 0.8;
    const randomPeak = rand() * amp * 0.5 * (0.2 + 0.8 * smoothEnvelope);
    
    peaks.push(baseHeight + randomPeak);
  }
  return peaks;
}

// ── Village (procedural townhomes + flicker) ─────────────────────────────
type WindowData = {
  ox: number;
  oy: number;
  w: number;
  h: number;
  phase: number;
  flicker: number;
  base: number;
  blink: number;
};

type HouseData = {
  x: number;
  baseY: number;
  w: number;
  h: number;
  roofH: number;
  roofStyle: 0 | 1 | 2;
  windows: WindowData[];
  depth: 0 | 1;
};

type StreetlightData = {
  t: number; // 0..1 down the road
  side: -1 | 1;
  phase: number;
  flicker: number;
  base: number;
};

function generateHouseWindows(rand: () => number, depth: 0 | 1): WindowData[] {
  const windows: WindowData[] = [];
  const cols = depth === 0 ? (rand() < 0.55 ? 3 : 2 + Math.floor(rand() * 3)) : (rand() < 0.75 ? 2 : 3);
  const rows = depth === 0 ? (rand() < 0.6 ? 2 : 1) : 1;
  const marginX = 0.12 + rand() * 0.05;
  const marginY = depth === 0 ? 0.18 : 0.24;
  const colW = (1 - marginX * 2) / cols;
  const rowH = (1 - marginY * 2) / Math.max(1, rows);
  const winW = colW * (depth === 0 ? 0.62 : 0.55);
  const winH = rowH * (depth === 0 ? 0.44 : 0.42);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (depth === 1 && rand() < 0.22) continue;
      windows.push({
        ox: marginX + c * colW + (colW - winW) * 0.5,
        oy: marginY + r * rowH + (rowH - winH) * 0.5,
        w: winW,
        h: winH,
        phase: rand() * TAU,
        flicker: lerp(1.1, 2.6, rand()),
        base: lerp(depth === 0 ? 0.78 : 0.62, depth === 0 ? 1.0 : 0.84, rand()),
        blink: lerp(0.7, 1.35, rand()),
      });
    }
  }
  return windows;
}

function generateVillage() {
  const rand = seededRandom(222);
  const houses: HouseData[] = [];

  function addRow(depth: 0 | 1, side: -1 | 1, count: number) {
    const roadMin = 0.42;
    const roadMax = 0.58;
    const xMin = side === -1 ? 0.06 : roadMax + 0.03;
    const xMax = side === -1 ? roadMin - 0.03 : 0.94;
    const baseY = depth === 0 ? 0.58 : 0.565;
    const wMin = depth === 0 ? 0.045 : 0.03;
    const wMax = depth === 0 ? 0.075 : 0.055;
    const hMin = depth === 0 ? 0.035 : 0.025;
    const hMax = depth === 0 ? 0.068 : 0.045;

    const xs: number[] = [];
    for (let i = 0; i < count * 3; i++) xs.push(lerp(xMin, xMax, rand()));
    xs.sort((a, b) => a - b);

    const minGap = depth === 0 ? 0.016 : 0.012;
    let lastX = -1;
    for (let i = 0; i < xs.length && houses.length < 32; i++) {
      const x = xs[i];
      if (x - lastX < minGap) continue;
      lastX = x;

      const w = lerp(wMin, wMax, rand());
      const h = lerp(hMin, hMax, rand());
      const roofH = lerp(depth === 0 ? 0.02 : 0.014, depth === 0 ? 0.042 : 0.03, rand());
      houses.push({
        x,
        baseY,
        w,
        h,
        roofH,
        roofStyle: (Math.floor(rand() * 3) as 0 | 1 | 2),
        windows: generateHouseWindows(rand, depth),
        depth,
      });
      if (houses.filter(hh => hh.depth === depth && (hh.x < 0.42) === (side === -1)).length >= count) break;
    }
  }

  // Near row clusters
  addRow(0, -1, 9);
  addRow(0, 1, 9);
  // Far row silhouettes
  addRow(1, -1, 4);
  addRow(1, 1, 4);

  const streetlights: StreetlightData[] = [];
  const streetCount = 7;
  for (let i = 0; i < streetCount; i++) {
    streetlights.push({
      t: lerp(0.1, 0.95, rand()),
      side: rand() > 0.5 ? 1 : -1,
      phase: rand() * TAU,
      flicker: lerp(0.35, 0.8, rand()),
      base: lerp(0.55, 0.95, rand()),
    });
  }

  return { houses, streetlights };
}

// ── UFOs (subtle saucers near the sun) ──────────────────────────────────
type UfoData = {
  orbitR: number; // relative to min(W,H)
  orbitSpeed: number; // rad/sec
  phase: number;
  size: number; // relative to min(W,H)
  bobPhase: number;
  blink: number;
};

function generateUfos(): UfoData[] {
  const rand = seededRandom(303);
  const ufos: UfoData[] = [];
  for (let i = 0; i < 3; i++) {
    ufos.push({
      orbitR: lerp(0.06, 0.14, rand()),
      orbitSpeed: lerp(0.1, 0.22, rand()),
      phase: rand() * TAU,
      size: lerp(0.014, 0.023, rand()),
      bobPhase: rand() * TAU,
      blink: lerp(0.7, 1.4, rand()),
    });
  }
  return ufos;
}

// ── Mammoths (walk cycle with planted feet) ─────────────────────────────
type MammothSeed = {
  x: number;
  y: number;
  size: number;
  speed: number; // normalized units/sec
  phase: number;
};

function generateMammoths(): MammothSeed[] {
  const rand = seededRandom(404);
  const mams: MammothSeed[] = [];
  for (let i = 0; i < 3; i++) {
    const speed = lerp(0.018, 0.038, rand()) * (rand() > 0.5 ? 1 : -1);
    mams.push({
      x: rand() * 1.2 - 0.1,
      y: 0.7 + rand() * 0.15,
      size: 0.02 + rand() * 0.015,
      speed,
      phase: rand() * TAU,
    });
  }
  return mams;
}

// ── Pre-generate all static data ─────────────────────────────────────────
const SNOW_FAR = generateSnowLayer({
  seed: 101,
  count: 120,
  rMin: 0.5,
  rMax: 1.25,
  vyMin: 0.02,
  vyMax: 0.05,
  vxMin: -0.01,
  vxMax: 0.01,
});
const SNOW_NEAR = generateSnowLayer({
  seed: 102,
  count: 25,
  rMin: 1.25,
  rMax: 2.75,
  vyMin: 0.05,
  vyMax: 0.12,
  vxMin: -0.02,
  vxMax: 0.02,
});
const MOUNTAINS_FAR = generateMountains(77, 10, 0.2);
const MOUNTAINS_NEAR = generateMountains(88, 8, 0.15);
const VILLAGE = generateVillage();
const VILLAGE_FAR = VILLAGE.houses.filter(h => h.depth === 1);
const VILLAGE_NEAR = VILLAGE.houses.filter(h => h.depth === 0);
const UFOS = generateUfos();
const MAMMOTHS = generateMammoths();

export default function HyperboreaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const sunImgRef = useRef<HTMLImageElement | null>(null);
  const fxIntensityRef = useRef<number>(1.0);

  useEffect(() => {
    const img = new Image();
    img.src = '/assets/hyperborea-sun.png';
    img.onload = () => {
      sunImgRef.current = img;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number;

    const snowFar = SNOW_FAR.map(s => ({ ...s }));
    const snowNear = SNOW_NEAR.map(s => ({ ...s }));

    type MammothLegState = { contactX: number; nextContactX: number; wasStance: boolean };
    type MammothState = { x: number; y: number; size: number; speed: number; phase: number; legs: MammothLegState[] };

    const mammothsData: MammothState[] = MAMMOTHS.map((m, idx) => {
      const legs: MammothLegState[] = [];
      for (let i = 0; i < 4; i++) {
        const base = m.x + (idx * 0.07) + (i - 1.5) * 0.008;
        legs.push({ contactX: base, nextContactX: base, wasStance: false });
      }
      return { ...m, legs };
    });

    let scanlinePattern: CanvasPattern | null = null;
    let fxObserver: MutationObserver | null = null;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth * dpr;
      H = window.innerHeight * dpr;
      canvas!.width = W;
      canvas!.height = H;
      scanlinePattern = null;
    }
    resize();
    window.addEventListener('resize', resize);

    // FX intensity detection (fx-cinematic vs fx-max)
    const wrapper = canvas.closest('.theme-atmo') as HTMLElement | null;
    if (wrapper) {
      const updateFx = () => {
        fxIntensityRef.current = wrapper.classList.contains('fx-max') ? 1.8 : 1.0;
      };
      updateFx();
      fxObserver = new MutationObserver(updateFx);
      fxObserver.observe(wrapper, { attributes: true, attributeFilter: ['class'] });
    } else {
      fxIntensityRef.current = 1.0;
    }

    function getScanlinePattern() {
      if (!scanlinePattern) {
        const pc = document.createElement('canvas');
        pc.width = 4;
        pc.height = 4;
        const pctx = pc.getContext('2d')!;
        pctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        pctx.fillRect(0, 0, 4, 2);
        scanlinePattern = ctx!.createPattern(pc, 'repeat');
      }
      return scanlinePattern;
    }

    function getSunParams() {
      const cx = W * 0.5;
      const cy = H * 0.35;
      const size = Math.min(W, H) * 0.55;
      return { cx, cy, size };
    }

    // ── Draw: Sky ────────────────────────────────────────────────────
    function drawSky() {
      const grad = ctx!.createLinearGradient(0, 0, 0, H * 0.6);
      grad.addColorStop(0, COLORS.skyTop);
      grad.addColorStop(0.5, COLORS.skyMid);
      grad.addColorStop(0.85, COLORS.skyLow);
      grad.addColorStop(1, COLORS.horizon);
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H * 0.6);
    }

    // ── Draw: Aurora ribbons (subtle; near the sun) ──────────────────
    function drawAurora(time: number, intensity: number, sun: { cx: number; cy: number; size: number }) {
      const { cx, cy, size } = sun;
      const baseAlpha = lerp(0.085, 0.145, clamp((intensity - 1) / 0.8, 0, 1));
      const skyMaskTop = H * 0.08;
      const skyMaskBot = H * 0.58;

      ctx!.save();
      ctx!.globalCompositeOperation = 'screen';
      ctx!.globalAlpha = baseAlpha;

      const x0 = W * 0.25;
      const x1 = W * 0.75;
      const ribbons = 3;

      for (let i = 0; i < ribbons; i++) {
        const phase = i * 1.8 + 0.7;
        const baseY = cy + (i - 1) * H * 0.035 + Math.sin(time * 0.12 + phase) * H * 0.01;
        const amp1 = H * (0.012 + i * 0.003);
        const amp2 = H * (0.006 + i * 0.002);
        const pts = 24;

        const grad = ctx!.createLinearGradient(x0, 0, x1, 0);
        grad.addColorStop(0, 'rgba(34, 211, 238, 0.0)');
        grad.addColorStop(0.28, 'rgba(34, 211, 238, 0.8)');
        grad.addColorStop(0.55, 'rgba(74, 222, 128, 0.85)');
        grad.addColorStop(0.78, 'rgba(167, 139, 250, 0.55)');
        grad.addColorStop(1, 'rgba(74, 222, 128, 0.0)');

        ctx!.beginPath();
        for (let j = 0; j < pts; j++) {
          const u = j / (pts - 1);
          const x = lerp(x0, x1, u);
          const y =
            baseY +
            Math.sin(time * 0.25 + phase + x * 0.004) * amp1 +
            Math.sin(time * 0.12 + phase * 1.7 + x * 0.008) * amp2 +
            (u - 0.5) * (u - 0.5) * H * 0.02 * (i - 1);

          if (j === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }

        ctx!.strokeStyle = grad;
        ctx!.lineCap = 'round';
        ctx!.lineJoin = 'round';
        ctx!.shadowColor = 'rgba(56, 189, 248, 0.25)';
        ctx!.shadowBlur = (6 + 10 * intensity) * (i === 1 ? 1.2 : 1.0);
        ctx!.lineWidth = Math.min(W, H) * (0.028 + i * 0.004);
        ctx!.stroke();
        ctx!.shadowBlur = 0;
      }

      // Keep aurora near the sun by punching a soft hole around it.
      ctx!.globalCompositeOperation = 'destination-out';
      const holeR0 = size * 0.26;
      const holeR1 = size * 0.58;
      const hole = ctx!.createRadialGradient(cx, cy, holeR0, cx, cy, holeR1);
      hole.addColorStop(0, 'rgba(0,0,0,0.7)');
      hole.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = hole;
      ctx!.beginPath();
      ctx!.arc(cx, cy, holeR1, 0, TAU);
      ctx!.fill();

      // Limit to sky band.
      ctx!.globalCompositeOperation = 'destination-in';
      const mask = ctx!.createLinearGradient(0, skyMaskTop, 0, skyMaskBot);
      mask.addColorStop(0, 'rgba(0,0,0,0)');
      mask.addColorStop(0.15, 'rgba(0,0,0,1)');
      mask.addColorStop(0.85, 'rgba(0,0,0,1)');
      mask.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = mask;
      ctx!.fillRect(0, 0, W, H);

      ctx!.restore();
    }

    // ── Draw: Sun (spinning asset) ───────────────────────────────────
    function drawSun(time: number, sun: { cx: number; cy: number; size: number }) {
      if (!sunImgRef.current) return;
      const { cx, cy, size } = sun;
      
      // Warm glow behind sun
      const glowGrad = ctx!.createRadialGradient(cx, cy, size * 0.1, cx, cy, size * 1.2);
      glowGrad.addColorStop(0, 'rgba(255, 235, 150, 0.6)');
      glowGrad.addColorStop(0.2, 'rgba(251, 188, 5, 0.3)');
      glowGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.1)');
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = glowGrad;
      ctx!.beginPath();
      ctx!.arc(cx, cy, size * 1.2, 0, Math.PI * 2);
      ctx!.fill();

      // Spinning image
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(time * 0.2); // Spin speed
      ctx!.drawImage(sunImgRef.current, -size / 2, -size / 2, size, size);
      ctx!.restore();
    }

    // ── Draw: UFOs ───────────────────────────────────────────────────
    function drawUfos(time: number, intensity: number, sun: { cx: number; cy: number; size: number }) {
      const { cx, cy } = sun;
      const minD = Math.min(W, H);
      const glowA = 0.18 * clamp(intensity, 1, 2);

      for (const u of UFOS) {
        const orbitR = u.orbitR * minD;
        const ang = time * u.orbitSpeed + u.phase;
        const x = cx + Math.cos(ang) * orbitR;
        const y = cy + Math.sin(ang) * orbitR * 0.45 + Math.sin(time * 0.9 + u.bobPhase) * orbitR * 0.06;
        const s = u.size * minD;

        const nav = 0.55 + 0.45 * Math.sin(time * (1.2 * u.blink) + u.phase * 1.7);

        ctx!.save();
        ctx!.translate(x, y);

        // Glow (subtle in cinematic, richer in fx-max)
        ctx!.shadowColor = `rgba(56, 189, 248, ${glowA})`;
        ctx!.shadowBlur = 10 * intensity;

        // Saucer base
        ctx!.fillStyle = 'rgba(15, 23, 37, 0.92)';
        ctx!.beginPath();
        ctx!.ellipse(0, 0, s * 1.25, s * 0.45, 0, 0, TAU);
        ctx!.fill();

        // Dome
        ctx!.shadowBlur = 0;
        ctx!.fillStyle = 'rgba(30, 41, 59, 0.75)';
        ctx!.beginPath();
        ctx!.ellipse(0, -s * 0.18, s * 0.55, s * 0.35, 0, Math.PI, 0);
        ctx!.closePath();
        ctx!.fill();

        // Rim highlight
        ctx!.strokeStyle = `rgba(56, 189, 248, ${0.45 * intensity})`;
        ctx!.lineWidth = Math.max(1, s * 0.12);
        ctx!.beginPath();
        ctx!.ellipse(0, s * 0.03, s * 1.18, s * 0.38, 0, 0, TAU);
        ctx!.stroke();

        // Nav light
        ctx!.fillStyle = `rgba(34, 211, 238, ${0.35 + 0.35 * nav})`;
        ctx!.beginPath();
        ctx!.arc(s * 0.75, s * 0.1, Math.max(1.2, s * 0.12), 0, TAU);
        ctx!.fill();

        ctx!.restore();
      }
    }

    // ── Draw: Mountains ──────────────────────────────────────────────
    function drawMountains(peaks: number[], color: string, baseH: number) {
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.moveTo(0, H);
      const step = W / (peaks.length - 1);
      for (let i = 0; i < peaks.length; i++) {
        const x = i * step;
        const y = baseH - peaks[i] * H;
        ctx!.lineTo(x, y);
      }
      ctx!.lineTo(W, H);
      ctx!.closePath();
      ctx!.fill();
    }

    // ── Draw: Ground / Snow ──────────────────────────────────────────
    function drawGround() {
      const startY = H * 0.55;
      const grad = ctx!.createLinearGradient(0, startY, 0, H);
      grad.addColorStop(0, COLORS.snowDark);
      grad.addColorStop(1, COLORS.snowGround);
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, startY, W, H - startY);
    }

    // ── Draw: Town Road ──────────────────────────────────────────────
    function drawRoad() {
      const startY = H * 0.58;
      const endY = H;
      const roadTopW = W * 0.15;
      const roadBotW = W * 0.6;
      
      ctx!.fillStyle = 'rgba(74, 91, 117, 0.4)'; // subtle dark snow/road overlay
      ctx!.beginPath();
      ctx!.moveTo(W * 0.5 - roadTopW / 2, startY);
      ctx!.lineTo(W * 0.5 + roadTopW / 2, startY);
      ctx!.lineTo(W * 0.5 + roadBotW / 2, endY);
      ctx!.lineTo(W * 0.5 - roadBotW / 2, endY);
      ctx!.closePath();
      ctx!.fill();
    }

    // ── Draw: Nordic Village (two rows + flicker + streetlights) ─────
    function drawHouseSil(h: HouseData) {
      const baseY = h.baseY * H;
      const hx = h.x * W;
      const hw = h.w * W;
      const hh = h.h * H;
      const hr = h.roofH * H;

      // Building base
      ctx!.beginPath();
      ctx!.moveTo(hx, baseY);
      ctx!.lineTo(hx, baseY - hh);
      ctx!.lineTo(hx + hw, baseY - hh);
      ctx!.lineTo(hx + hw, baseY);
      ctx!.closePath();
      ctx!.fill();

      // Roof variations
      if (h.roofStyle === 0) {
        // Steep triangle
        ctx!.beginPath();
        ctx!.moveTo(hx - hw * 0.1, baseY - hh);
        ctx!.lineTo(hx + hw * 0.5, baseY - hh - hr);
        ctx!.lineTo(hx + hw * 1.1, baseY - hh);
        ctx!.closePath();
        ctx!.fill();
      } else if (h.roofStyle === 1) {
        // Stepped gable
        ctx!.beginPath();
        ctx!.moveTo(hx - hw * 0.08, baseY - hh);
        ctx!.lineTo(hx + hw * 0.28, baseY - hh - hr * 0.65);
        ctx!.lineTo(hx + hw * 0.72, baseY - hh - hr);
        ctx!.lineTo(hx + hw * 1.08, baseY - hh);
        ctx!.closePath();
        ctx!.fill();
      } else {
        // Flat with chimney
        ctx!.beginPath();
        ctx!.moveTo(hx - hw * 0.06, baseY - hh);
        ctx!.lineTo(hx + hw * 1.06, baseY - hh);
        ctx!.lineTo(hx + hw * 1.06, baseY - hh - hr * 0.45);
        ctx!.lineTo(hx - hw * 0.06, baseY - hh - hr * 0.45);
        ctx!.closePath();
        ctx!.fill();

        // Chimney
        ctx!.beginPath();
        ctx!.rect(hx + hw * 0.74, baseY - hh - hr * 0.95, hw * 0.1, hr * 0.7);
        ctx!.fill();
      }
    }

    function drawVillage(time: number, intensity: number) {
      // Silhouettes
      ctx!.fillStyle = COLORS.villageSil;
      for (const h of VILLAGE_FAR) drawHouseSil(h);
      for (const h of VILLAGE_NEAR) drawHouseSil(h);

      // Windows (second pass)
      const glowColor = COLORS.windowGlow;
      for (const h of VILLAGE.houses) {
        const baseY = h.baseY * H;
        const hx = h.x * W;
        const hw = h.w * W;
        const hh = h.h * H;
        const winPad = hh * (h.depth === 0 ? 0.02 : 0.03);

        const intensityBoost = 0.85 + 0.25 * (intensity - 1);

        ctx!.save();
        ctx!.fillStyle = glowColor;
        for (const w of h.windows) {
          const wx = hx + w.ox * hw;
          const wy = baseY - hh + w.oy * hh;
          const ww = w.w * hw;
          const wh = w.h * hh;

          const flick = 0.75 + 0.25 * Math.sin(time * w.flicker + w.phase);
          const blinkSrc = Math.sin(time * (0.18 * w.blink) + w.phase * 2.3);
          const blink = smoothstep(0.86, 0.99, blinkSrc);

          const b = clamp(w.base * flick * (1 - 0.55 * blink) * intensityBoost, 0, 1);

          ctx!.globalAlpha = 0.35 + 0.55 * b;
          ctx!.shadowColor = glowColor;
          ctx!.shadowBlur = (6 + 10 * b) * (h.depth === 0 ? 1.0 : 0.75) * intensity;

          ctx!.fillRect(wx + winPad, wy + winPad, Math.max(1, ww - winPad * 2), Math.max(1, wh - winPad * 2));
        }
        ctx!.restore();
      }

      // Streetlights (warm orbs at road edges)
      const startY = H * 0.58;
      const endY = H;
      const roadTopW = W * 0.15;
      const roadBotW = W * 0.6;

      for (const l of VILLAGE.streetlights) {
        const y = lerp(startY + H * 0.06, endY - H * 0.06, l.t);
        const u = clamp((y - startY) / (endY - startY), 0, 1);
        const halfW = lerp(roadTopW / 2, roadBotW / 2, u);
        const x = W * 0.5 + l.side * (halfW + W * 0.018);

        const flick = 0.82 + 0.18 * Math.sin(time * l.flicker + l.phase);
        const b = clamp(l.base * flick * (0.85 + 0.25 * (intensity - 1)), 0, 1);

        // Post
        ctx!.strokeStyle = 'rgba(20, 29, 46, 0.85)';
        ctx!.lineWidth = Math.max(1, W * 0.0012);
        ctx!.beginPath();
        ctx!.moveTo(x, y);
        ctx!.lineTo(x, y - H * 0.045);
        ctx!.stroke();

        // Orb
        ctx!.shadowColor = COLORS.windowGlow;
        ctx!.shadowBlur = 14 * intensity * b;
        ctx!.fillStyle = `rgba(251, 188, 5, ${0.18 + 0.45 * b})`;
        ctx!.beginPath();
        ctx!.arc(x, y - H * 0.05, Math.max(2, W * 0.0032), 0, TAU);
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      ctx!.globalAlpha = 1;
    }

    // ── Draw: Wooly Mammoths ─────────────────────────────────────────
    function drawMammoths(time: number, dt: number) {
      const legDefs = [
        { hipX: -0.78, hipY: -0.2, offset: 0.0, depth: 0.92 },
        { hipX: -0.52, hipY: -0.2, offset: 0.5, depth: 0.82 },
        { hipX: 0.52, hipY: -0.2, offset: 0.5, depth: 0.86 },
        { hipX: 0.78, hipY: -0.2, offset: 0.0, depth: 0.78 },
      ];

      for (const m of mammothsData) {
        const oldX = m.x;
        m.x += m.speed * dt;
        let wrapped = false;
        if (m.x > 1.2) { m.x = -0.2; wrapped = true; }
        if (m.x < -0.2) { m.x = 1.2; wrapped = true; }
        if (wrapped) {
          const shift = m.x - oldX;
          for (const leg of m.legs) {
            leg.contactX += shift;
            leg.nextContactX += shift;
          }
        }

        const bodyWorldX = m.x * W;
        const groundWorldY = m.y * H;
        const s = m.size * W;
        const drawScale = m.speed > 0 ? -1 : 1; // default art faces left; flip when moving right
        const moveDir = -drawScale; // world direction (+1 right, -1 left)

        const stepRate = 1.1 + Math.abs(m.speed) * 10;
        const strideNorm = clamp((Math.abs(m.speed) / stepRate) * 0.9, 0.018, 0.06);
        const bob = Math.sin(time * stepRate * TAU * 2 + m.phase) * (s * 0.04);

        const bodyDrawY = groundWorldY + bob;

        // Update legs (foot plant)
        for (let i = 0; i < 4; i++) {
          const def = legDefs[i];
          const leg = m.legs[i];
          const p = fract(time * stepRate + def.offset + m.phase * 0.07);
          const inStance = p < 0.55;

          if (!leg.wasStance && inStance) {
            // swing -> stance: lock to landing
            leg.contactX = leg.nextContactX;
          }
          if (leg.wasStance && !inStance) {
            // stance -> swing: set next contact deterministically
            leg.nextContactX = leg.contactX + strideNorm * moveDir;
          }
          leg.wasStance = inStance;
        }

        ctx!.save();
        ctx!.translate(bodyWorldX, bodyDrawY);
        ctx!.scale(drawScale, 1);

        // Legs as 2-segment lines (draw back legs first for depth)
        const footLiftPx = s * 0.22;
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < 4; i++) {
            const def = legDefs[i];
            const isBackLeg = i >= 2;
            if ((pass === 0) !== isBackLeg) continue;

            const p = fract(time * stepRate + def.offset + m.phase * 0.07);
            const inStance = p < 0.55;
            const swingT = inStance ? 0 : clamp((p - 0.55) / 0.45, 0, 1);

            const footWorldX = inStance
              ? m.legs[i].contactX * W
              : lerp(m.legs[i].contactX, m.legs[i].nextContactX, smoothstep(0, 1, swingT)) * W;
            const footWorldY = groundWorldY - Math.sin(Math.PI * swingT) * footLiftPx;

            // Hip world position derived from body + local offset
            const hipWorldX = bodyWorldX + def.hipX * s * drawScale;
            const hipWorldY = bodyDrawY + def.hipY * s;

            const hipX = (hipWorldX - bodyWorldX) * drawScale;
            const hipY = hipWorldY - bodyDrawY;
            const footX = (footWorldX - bodyWorldX) * drawScale;
            const footY = footWorldY - bodyDrawY;

            const midX = (hipX + footX) * 0.5;
            const midY = (hipY + footY) * 0.5;
            const kneeBend = (s * 0.14) * (inStance ? 0.55 : 1.0);
            const kneeX = midX + moveDir * kneeBend;
            const kneeY = midY - kneeBend * 0.35;

            ctx!.strokeStyle = `rgba(15, 23, 37, ${def.depth})`;
            ctx!.lineWidth = Math.max(1, s * 0.12);
            ctx!.lineCap = 'round';
            ctx!.beginPath();
            ctx!.moveTo(hipX, hipY);
            ctx!.lineTo(kneeX, kneeY);
            ctx!.lineTo(footX, footY);
            ctx!.stroke();
          }
        }

        // Body (humped shape)
        ctx!.fillStyle = COLORS.mammothBody;
        ctx!.beginPath();
        ctx!.ellipse(0, -s, s, s * 0.7, 0, Math.PI, 0);
        ctx!.lineTo(s * 0.95, -s * 0.05);
        ctx!.lineTo(-s * 1.25, -s * 0.05);
        ctx!.closePath();
        ctx!.fill();

        // Head
        ctx!.beginPath();
        ctx!.arc(-s * 1.1, -s * 0.72, s * 0.52, 0, TAU);
        ctx!.fill();

        // Trunk
        const trunkWobble = Math.sin(time * 1.2 + m.phase) * 0.12;
        ctx!.beginPath();
        ctx!.moveTo(-s * 1.4, -s * 0.72);
        ctx!.quadraticCurveTo(-s * 1.85 + trunkWobble * s, -s * 0.2, -s * 1.55, s * 0.35);
        ctx!.lineWidth = s * 0.18;
        ctx!.lineCap = 'round';
        ctx!.strokeStyle = COLORS.mammothBody;
        ctx!.stroke();

        // Tusk
        ctx!.beginPath();
        ctx!.moveTo(-s * 1.18, -s * 0.42);
        ctx!.quadraticCurveTo(-s * 2.15, -s * 0.2, -s * 2.0, -s * 0.82);
        ctx!.lineWidth = s * 0.09;
        ctx!.strokeStyle = COLORS.mammothTusk;
        ctx!.stroke();

        ctx!.restore();
      }
    }

    // ── Draw: Snow Particles ─────────────────────────────────────────
    function updateAndDrawSnowLayer(layer: SnowParticle[], time: number, dt: number, alpha: number, windAmp: number) {
      ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      for (const s of layer) {
        s.y += s.vy * dt;
        s.x += (s.vx + Math.sin(time * 0.8 + s.phase) * windAmp) * dt;

        if (s.y > 1.08) {
          s.y = -0.08;
          s.x = fract(s.x + 0.37 + 0.11 * Math.sin(s.phase * 7.3));
        }

        s.x = fract(s.x);

        ctx!.beginPath();
        ctx!.arc(s.x * W, s.y * H, s.r, 0, TAU);
        ctx!.fill();
      }
    }

    function drawSnow(time: number, dt: number, intensity: number) {
      const farA = 0.16 + 0.04 * (intensity - 1);
      const nearA = 0.12 + 0.06 * (intensity - 1);
      updateAndDrawSnowLayer(snowFar, time, dt, farA, 0.012);
      updateAndDrawSnowLayer(snowNear, time, dt, nearA, 0.016);
    }

    // ── Draw: Vignette ───────────────────────────────────────────────
    function drawVignette() {
      const vg = ctx!.createRadialGradient(W * 0.5, H * 0.5, W * 0.3, W * 0.5, H * 0.5, W * 0.8);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx!.fillStyle = vg;
      ctx!.fillRect(0, 0, W, H);
    }

    // ── Main draw loop ───────────────────────────────────────────────
    let lastT = 0;
    function draw(t: number) {
      const time = t * 0.001;
      const dt = lastT ? clamp((t - lastT) / 1000, 0, 0.033) : 0;
      lastT = t;
      const intensity = fxIntensityRef.current;
      ctx!.clearRect(0, 0, W, H);

      const sun = getSunParams();

      drawSky();
      drawAurora(time, intensity, sun);
      drawSun(time, sun);
      drawUfos(time, intensity, sun);
      drawMountains(MOUNTAINS_FAR, COLORS.mountainFar, H * 0.55);
      drawMountains(MOUNTAINS_NEAR, COLORS.mountainNear, H * 0.60);
      drawGround();
      drawRoad();
      drawVillage(time, intensity);
      drawMammoths(time, dt);
      drawSnow(time, dt, intensity);
      drawVignette();

      const pat = getScanlinePattern();
      if (pat) {
        ctx!.fillStyle = pat;
        ctx!.fillRect(0, 0, W, H);
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      fxObserver?.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="hyperborea-bg-wrap"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
