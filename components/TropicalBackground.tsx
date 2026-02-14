/**
 * TropicalBackground – animated HTML5 Canvas backdrop for the 'tropical' theme.
 *
 * Renders a tropical island synthwave scene:
 *   - Deep blue-teal sky with twinkling stars and shooting stars
 *   - Synthwave sun with horizontal slice effect and glow rings
 *   - Layered puffy clouds and distant bird silhouettes
 *   - Atmospheric haze and neon horizon glow band
 *   - Ocean with synthwave grid, rolling swells, bioluminescent wave crests
 *   - Shimmering sun reflection columns on water
 *   - Sandy island with animated surf/foam and vegetation tufts
 *   - Palm trees (detailed on island, silhouette foreground framing)
 *   - Flying parrots with flapping wings
 *   - Glowing firefly particles
 *   - Film grain (CRT scanlines) + vignette post-processing
 *
 * Positioned as a fixed full-viewport layer behind all content (z-index: -1).
 */
import { useEffect, useRef } from 'react';

// ── Color palette (muted tropical teal #2c8f7b + warm orange) ────────────
const COLORS = {
  skyTop: '#0a0f1e',
  skyMid: '#0d2137',
  skyLow: '#1a3a4a',
  horizon: '#0f3542',
  sunTop: '#ff6b35',
  sunMid: '#ff9f1c',
  sunBot: '#ffe66d',
  water: '#0a2a3a',
  waterHighlight: '#2c8f7b',
  waterDeep: '#061a28',
  palmTrunk: '#1a3025',
  palmFrond: '#0d6b3a',
  palmFrondLight: '#2c8f7b',
  sand: '#c2956a',
  sandDark: '#8a6842',
  parrotBody: '#e05a2b',
  parrotWing: '#2c8f7b',
  parrotBeak: '#e6cf63',
};

// ── Deterministic pseudo-random (for consistent star layout) ─────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

// ── Stars ────────────────────────────────────────────────────────────────
function generateStars(count: number, seed: number) {
  const rand = seededRandom(seed);
  const stars: { x: number; y: number; r: number; twinkle: number; speed: number }[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand() * 1.2 - 0.1,
      y: rand() * 0.4,
      r: rand() * 1.5 + 0.3,
      twinkle: rand() * Math.PI * 2,
      speed: rand() * 1.5 + 0.5,
    });
  }
  return stars;
}

// ── Clouds (layered puffs) ───────────────────────────────────────────────
function generateClouds(count: number) {
  const rand = seededRandom(77);
  const clouds: { x: number; y: number; puffs: { ox: number; oy: number; w: number; h: number; opacity: number }[]; speed: number }[] = [];
  for (let i = 0; i < count; i++) {
    const cx = rand() * 1.4 - 0.2;
    const cy = 0.08 + rand() * 0.18;
    const baseW = 0.06 + rand() * 0.12;
    const puffs: { ox: number; oy: number; w: number; h: number; opacity: number }[] = [];
    const puffCount = 3 + Math.floor(rand() * 3);
    for (let p = 0; p < puffCount; p++) {
      puffs.push({
        ox: (rand() - 0.5) * baseW * 0.8,
        oy: (rand() - 0.5) * 0.008,
        w: baseW * (0.4 + rand() * 0.6),
        h: 0.006 + rand() * 0.01,
        opacity: 0.08 + rand() * 0.12,
      });
    }
    clouds.push({ x: cx, y: cy, puffs, speed: (rand() * 0.3 + 0.1) * 0.00008 });
  }
  return clouds;
}

// ── Distant birds ────────────────────────────────────────────────────────
function generateBirds(count: number) {
  const rand = seededRandom(99);
  const birds: { x: number; y: number; speed: number; flapPhase: number; flapSpeed: number; size: number }[] = [];
  for (let i = 0; i < count; i++) {
    birds.push({
      x: rand() * 0.6 + 0.2,
      y: 0.12 + rand() * 0.15,
      speed: 0.00003 + rand() * 0.00004,
      flapPhase: rand() * Math.PI * 2,
      flapSpeed: 3 + rand() * 2,
      size: 3 + rand() * 4,
    });
  }
  return birds;
}

// ── Parrots ──────────────────────────────────────────────────────────────
interface ParrotData {
  baseX: number;
  baseY: number;
  size: number;
  delay: number;
  flapPhase: number;
  driftPhase: number;
}

function generateParrots(): ParrotData[] {
  const rand = seededRandom(55);
  const defs = [
    { baseX: 0.18, baseY: 0.18, size: 5, delay: 0 },
    { baseX: 0.25, baseY: 0.14, size: 4, delay: 2 },
    { baseX: 0.78, baseY: 0.16, size: 4.5, delay: 4 },
    { baseX: 0.85, baseY: 0.22, size: 3.5, delay: 1 },
  ];
  return defs.map(d => ({
    ...d,
    flapPhase: rand() * Math.PI * 2,
    driftPhase: rand() * Math.PI * 2,
  }));
}

// ── Particles ────────────────────────────────────────────────────────────
function generateParticles(count: number) {
  const rand = seededRandom(33);
  const particles: { x: number; y: number; phase: number; size: number }[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: rand(),
      y: 0.3 + rand() * 0.35,
      phase: rand() * Math.PI * 2,
      size: rand() * 2 + 0.5,
    });
  }
  return particles;
}

// ── Pre-generate all static data ─────────────────────────────────────────
const STARS = generateStars(120, 42);
const CLOUDS = generateClouds(8);
const BIRDS = generateBirds(5);
const PARROTS = generateParrots();
const PARTICLES = generateParticles(40);

export default function TropicalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number;

    // Mutable copies for animated state
    const clouds = CLOUDS.map(c => ({ ...c, puffs: c.puffs.map(p => ({ ...p })) }));
    const birds = BIRDS.map(b => ({ ...b }));
    const shootingStars: { x: number; y: number; vx: number; vy: number; life: number; decay: number; len: number }[] = [];

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth * dpr;
      H = window.innerHeight * dpr;
      canvas!.width = W;
      canvas!.height = H;
      // Rebuild scanline pattern on resize
      scanlinePattern = null;
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Scanline pattern (pre-rendered) ──────────────────────────────
    let scanlinePattern: CanvasPattern | null = null;
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

    // ── Draw: Sky ────────────────────────────────────────────────────
    function drawSky(time: number) {
      const warmShift = Math.sin(time * 0.08) * 0.015;
      const grad = ctx!.createLinearGradient(0, 0, 0, H * 0.55);
      grad.addColorStop(0, COLORS.skyTop);
      grad.addColorStop(0.5, COLORS.skyMid);
      grad.addColorStop(0.85, COLORS.skyLow);
      grad.addColorStop(1, COLORS.horizon);
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H * 0.55);

      const glowGrad = ctx!.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.35, H * 0.35);
      glowGrad.addColorStop(0, `rgba(255, 107, 53, ${0.08 + warmShift})`);
      glowGrad.addColorStop(0.4, `rgba(44, 143, 123, ${0.02 + warmShift * 0.5})`);
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = glowGrad;
      ctx!.fillRect(0, 0, W, H * 0.6);
    }

    // ── Draw: Stars ──────────────────────────────────────────────────
    function drawStars(time: number) {
      for (const s of STARS) {
        const alpha = 0.3 + Math.sin(time * s.speed + s.twinkle) * 0.3;
        ctx!.fillStyle = `rgba(255, 255, 255, ${Math.max(0.05, alpha)})`;
        ctx!.beginPath();
        ctx!.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    // ── Draw: Shooting stars ─────────────────────────────────────────
    function spawnShootingStar() {
      const rand = Math.random;
      shootingStars.push({
        x: rand() * 0.6 + 0.1,
        y: rand() * 0.2 + 0.02,
        vx: (rand() * 0.3 + 0.2) * (rand() > 0.5 ? 1 : -1),
        vy: rand() * 0.15 + 0.08,
        life: 1.0,
        decay: 0.008 + rand() * 0.01,
        len: 0.03 + rand() * 0.02,
      });
    }

    function drawShootingStars(time: number) {
      if (Math.random() < 0.003) spawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.life -= s.decay;
        if (s.life <= 0) { shootingStars.splice(i, 1); continue; }

        const x = s.x * W, y = s.y * H;
        const tailX = (s.x - s.vx * s.len) * W;
        const tailY = (s.y - s.vy * s.len) * H;

        const grad = ctx!.createLinearGradient(tailX, tailY, x, y);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, `rgba(255,255,255,${s.life * 0.8})`);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(tailX, tailY);
        ctx!.lineTo(x, y);
        ctx!.stroke();

        ctx!.fillStyle = `rgba(255,255,255,${s.life})`;
        ctx!.beginPath();
        ctx!.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx!.fill();

        s.x += s.vx * 0.002;
        s.y += s.vy * 0.002;
      }
    }

    // ── Draw: Clouds ─────────────────────────────────────────────────
    function drawClouds() {
      for (const c of clouds) {
        c.x += c.speed;
        if (c.x > 1.3) c.x = -0.25;
        for (const p of c.puffs) {
          const x = (c.x + p.ox) * W;
          const y = (c.y + p.oy) * H;
          const w = p.w * W;
          const h = p.h * H;
          const grad = ctx!.createRadialGradient(x, y, 0, x, y, w);
          grad.addColorStop(0, `rgba(30, 90, 110, ${p.opacity})`);
          grad.addColorStop(0.6, `rgba(20, 70, 90, ${p.opacity * 0.5})`);
          grad.addColorStop(1, 'rgba(20, 70, 90, 0)');
          ctx!.fillStyle = grad;
          ctx!.beginPath();
          ctx!.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
    }

    // ── Draw: Distant birds ──────────────────────────────────────────
    function drawDistantBirds(time: number) {
      for (const b of birds) {
        b.x += b.speed;
        if (b.x > 1.15) b.x = -0.05;
        const x = b.x * W;
        const y = (b.y + Math.sin(time * 0.4 + b.flapPhase) * 0.005) * H;
        const ws = b.size;
        const wy = Math.sin(time * b.flapSpeed + b.flapPhase) * ws * 0.5;
        ctx!.strokeStyle = 'rgba(10, 20, 30, 0.5)';
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        ctx!.moveTo(x - ws, y + wy);
        ctx!.quadraticCurveTo(x - ws * 0.3, y - wy * 0.3, x, y);
        ctx!.quadraticCurveTo(x + ws * 0.3, y - wy * 0.3, x + ws, y + wy);
        ctx!.stroke();
      }
    }

    // ── Draw: Sun ────────────────────────────────────────────────────
    function drawSun(time: number) {
      const cx = W * 0.5, cy = H * 0.33;
      const r = Math.min(W, H) * 0.08;

      // Glow rings
      for (let i = 4; i > 0; i--) {
        const glowR = r * (1 + i * 0.6);
        const alpha = 0.04 * (1 + Math.sin(time + i) * 0.3);
        const grad = ctx!.createRadialGradient(cx, cy, r * 0.5, cx, cy, glowR);
        grad.addColorStop(0, `rgba(255, 159, 28, ${alpha})`);
        grad.addColorStop(0.5, `rgba(255, 107, 53, ${alpha * 0.5})`);
        grad.addColorStop(1, 'rgba(255, 107, 53, 0)');
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Sun body + synthwave slices
      const grad = ctx!.createLinearGradient(cx, cy - r, cx, cy + r);
      grad.addColorStop(0, COLORS.sunTop);
      grad.addColorStop(0.5, COLORS.sunMid);
      grad.addColorStop(1, COLORS.sunBot);

      ctx!.save();
      ctx!.beginPath();
      ctx!.arc(cx, cy, r, 0, Math.PI * 2);
      ctx!.clip();
      ctx!.fillStyle = grad;
      ctx!.fillRect(cx - r, cy - r, r * 2, r * 2);

      ctx!.fillStyle = COLORS.skyMid;
      for (let i = 0; i < 8; i++) {
        const sliceY = cy + r * 0.1 + (i / 8) * r * 0.9;
        ctx!.fillRect(cx - r, sliceY, r * 2, (i + 1) * 1.2);
      }
      ctx!.restore();
    }

    // ── Draw: Atmospheric haze ───────────────────────────────────────
    function drawAtmosphericHaze(time: number) {
      const horizonY = H * 0.55;

      // Warm orange haze
      const hazeGrad = ctx!.createLinearGradient(0, horizonY - H * 0.15, 0, horizonY);
      hazeGrad.addColorStop(0, 'rgba(255, 107, 53, 0)');
      hazeGrad.addColorStop(0.5, `rgba(255, 140, 60, ${0.02 + Math.sin(time * 0.3) * 0.008})`);
      hazeGrad.addColorStop(1, `rgba(255, 107, 53, ${0.04 + Math.sin(time * 0.4) * 0.01})`);
      ctx!.fillStyle = hazeGrad;
      ctx!.fillRect(0, horizonY - H * 0.15, W, H * 0.15);

      // Drifting teal mist
      for (let i = 0; i < 3; i++) {
        const mx = (0.2 + i * 0.3 + Math.sin(time * 0.15 + i * 2) * 0.08) * W;
        const my = horizonY - H * 0.02;
        const mw = W * (0.15 + Math.sin(time * 0.2 + i) * 0.03);
        const mh = H * 0.04;
        const ma = 0.03 + Math.sin(time * 0.25 + i * 1.5) * 0.01;
        const mg = ctx!.createRadialGradient(mx, my, 0, mx, my, mw);
        mg.addColorStop(0, `rgba(44, 143, 123, ${ma})`);
        mg.addColorStop(1, 'rgba(44, 143, 123, 0)');
        ctx!.fillStyle = mg;
        ctx!.beginPath();
        ctx!.ellipse(mx, my, mw, mh, 0, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    // ── Draw: Horizon glow band ──────────────────────────────────────
    function drawHorizonGlow(time: number) {
      const horizonY = H * 0.55;
      const bandH = H * 0.06;

      const tg = ctx!.createLinearGradient(0, horizonY - bandH, 0, horizonY + bandH * 0.5);
      tg.addColorStop(0, 'rgba(44, 143, 123, 0)');
      tg.addColorStop(0.4, `rgba(44, 143, 123, ${0.04 + Math.sin(time * 0.5) * 0.015})`);
      tg.addColorStop(0.5, `rgba(44, 143, 123, ${0.08 + Math.sin(time * 0.7) * 0.02})`);
      tg.addColorStop(0.6, `rgba(255, 107, 53, ${0.04 + Math.sin(time * 0.6) * 0.015})`);
      tg.addColorStop(1, 'rgba(255, 107, 53, 0)');
      ctx!.fillStyle = tg;
      ctx!.fillRect(0, horizonY - bandH, W, bandH * 1.5);

      ctx!.strokeStyle = `rgba(44, 143, 123, ${0.12 + Math.sin(time) * 0.04})`;
      ctx!.lineWidth = 1.5;
      ctx!.beginPath();
      ctx!.moveTo(0, horizonY);
      ctx!.lineTo(W, horizonY);
      ctx!.stroke();
    }

    // ── Draw: Ocean ──────────────────────────────────────────────────
    function drawOcean(time: number) {
      const horizonY = H * 0.55;

      // Base gradient
      const wg = ctx!.createLinearGradient(0, horizonY, 0, H);
      wg.addColorStop(0, COLORS.water);
      wg.addColorStop(0.5, COLORS.waterDeep);
      wg.addColorStop(1, '#030e18');
      ctx!.fillStyle = wg;
      ctx!.fillRect(0, horizonY, W, H - horizonY);

      // Rolling swells
      for (let i = 0; i < 5; i++) {
        const t2 = (i + 2) / 20;
        const baseYS = horizonY + Math.pow(t2, 1.5) * (H - horizonY);
        const swH = 4 + i * 2;
        const swA = 0.025 * (1 - t2);
        if (swA <= 0) continue;
        ctx!.fillStyle = `rgba(44, 143, 123, ${swA})`;
        ctx!.beginPath();
        ctx!.moveTo(0, baseYS + swH);
        for (let x = 0; x <= W; x += W / 80) {
          const sw = Math.sin(time * 0.6 + x * 0.002 + i * 1.2) * swH;
          const rp = Math.sin(time * 1.5 + x * 0.008 + i * 3) * 1.5;
          ctx!.lineTo(x, baseYS + sw + rp);
        }
        ctx!.lineTo(W, baseYS + swH);
        ctx!.closePath();
        ctx!.fill();
      }

      // Synthwave grid: horizontal
      ctx!.strokeStyle = 'rgba(44, 143, 123, 0.05)';
      ctx!.lineWidth = 1;
      for (let i = 0; i < 25; i++) {
        const t2 = i / 25;
        const y = horizonY + Math.pow(t2, 1.8) * (H - horizonY);
        const wo = Math.sin(time * 0.8 + i * 0.5) * 3;
        ctx!.globalAlpha = t2 * 0.6;
        ctx!.beginPath();
        ctx!.moveTo(0, y + wo);
        for (let x = 0; x <= W; x += W / 40) {
          const wave = Math.sin(time + x * 0.003 + i * 0.3) * (2 + t2 * 5);
          ctx!.lineTo(x, y + wo + wave);
        }
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;

      // Synthwave grid: vertical converging
      const vanishX = W * 0.5;
      ctx!.strokeStyle = 'rgba(44, 143, 123, 0.03)';
      for (let i = 0; i < 20; i++) {
        const spread = (i - 10) / 10;
        ctx!.beginPath();
        ctx!.moveTo(vanishX, horizonY);
        ctx!.lineTo(vanishX + spread * W * 0.8, H);
        ctx!.stroke();
      }

      // Bioluminescent wave crests
      for (let i = 0; i < 8; i++) {
        const t2 = (i + 1) / 30;
        const y = horizonY + Math.pow(t2, 1.8) * (H - horizonY);
        const wo = Math.sin(time * 0.8 + i * 0.5) * 3;
        const alpha = 0.12 * (1 - t2 * 3);
        if (alpha <= 0) continue;
        ctx!.strokeStyle = `rgba(44, 143, 123, ${alpha})`;
        ctx!.lineWidth = 2;
        ctx!.shadowColor = 'rgba(44, 143, 123, 0.3)';
        ctx!.shadowBlur = 8;
        ctx!.beginPath();
        ctx!.moveTo(0, y + wo);
        for (let x = 0; x <= W; x += W / 60) {
          const wave = Math.sin(time + x * 0.003 + i * 0.3) * (2 + t2 * 5);
          ctx!.lineTo(x, y + wo + wave);
        }
        ctx!.stroke();
        ctx!.shadowBlur = 0;
      }

      // Shimmer reflections
      for (let i = 0; i < 30; i++) {
        const rx = (Math.sin(time * 0.3 + i * 7.3) * 0.5 + 0.5) * W;
        const ry = horizonY + Math.pow((i * 0.033 + 0.1), 0.5) * (H - horizonY) * 0.7;
        const rw = 10 + (i % 5) * 8;
        const alpha = 0.02 + Math.sin(time * 2 + i * 3) * 0.015;
        ctx!.fillStyle = `rgba(44, 143, 123, ${Math.max(0, alpha)})`;
        ctx!.fillRect(rx - rw / 2, ry, rw, 1.5);
      }

      // Sun reflection — shimmering columns
      const refCx = W * 0.5;
      const refTop = horizonY;
      const refBot = H * 0.85;
      const colMaxW = W * 0.012;
      for (let i = 0; i < 12; i++) {
        const spread = (i - 5.5) / 6;
        const baseX = refCx + spread * W * 0.06;
        const colAlpha = 0.08 * (1 - Math.abs(spread));
        if (colAlpha <= 0) continue;
        ctx!.fillStyle = `rgba(255, 159, 28, ${colAlpha})`;
        ctx!.beginPath();
        for (let s = 0; s <= 20; s++) {
          const st = s / 20;
          const sy = refTop + st * (refBot - refTop);
          const wobble = Math.sin(time * 2 + st * 8 + i * 1.5) * (colMaxW * 0.6 + st * colMaxW);
          const fadeW = colMaxW * (1 + st * 1.5) * (1 - Math.abs(spread) * 0.5);
          if (s === 0) ctx!.moveTo(baseX - fadeW + wobble, sy);
          else ctx!.lineTo(baseX - fadeW + wobble, sy);
        }
        for (let s = 20; s >= 0; s--) {
          const st = s / 20;
          const sy = refTop + st * (refBot - refTop);
          const wobble = Math.sin(time * 2 + st * 8 + i * 1.5 + 1) * (colMaxW * 0.6 + st * colMaxW);
          const fadeW = colMaxW * (1 + st * 1.5) * (1 - Math.abs(spread) * 0.5);
          ctx!.lineTo(baseX + fadeW + wobble, sy);
        }
        ctx!.closePath();
        ctx!.fill();
      }

      // Central bright reflection line
      const ba = 0.06 + Math.sin(time * 1.3) * 0.02;
      ctx!.strokeStyle = `rgba(255, 220, 100, ${ba})`;
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.moveTo(refCx, refTop);
      for (let s = 0; s <= 30; s++) {
        const st = s / 30;
        const sy = refTop + st * (refBot - refTop);
        const wobble = Math.sin(time * 2.5 + st * 10) * (3 + st * 8);
        ctx!.lineTo(refCx + wobble, sy);
      }
      ctx!.stroke();
    }

    // ── Draw: Island ─────────────────────────────────────────────────
    function drawIsland(time: number) {
      const cx = W * 0.5;
      const baseY = H * 0.52;
      const iw = W * 0.35;
      const ih = H * 0.06;

      // Sand
      const sg = ctx!.createRadialGradient(cx, baseY, 0, cx, baseY, iw);
      sg.addColorStop(0, COLORS.sand);
      sg.addColorStop(0.7, COLORS.sandDark);
      sg.addColorStop(1, 'rgba(138, 104, 66, 0)');
      ctx!.fillStyle = sg;
      ctx!.beginPath();
      ctx!.ellipse(cx, baseY, iw, ih, 0, 0, Math.PI * 2);
      ctx!.fill();

      // Vegetation base
      ctx!.fillStyle = 'rgba(13, 107, 58, 0.4)';
      ctx!.beginPath();
      ctx!.ellipse(cx, baseY - ih * 0.3, iw * 0.7, ih * 0.6, 0, Math.PI, Math.PI * 2);
      ctx!.fill();

      // Vegetation tufts
      for (let i = 0; i < 12; i++) {
        const angle = Math.PI + (i / 12) * Math.PI;
        const tx = cx + Math.cos(angle) * iw * 0.6;
        const tby = baseY - ih * 0.3 + Math.sin(angle) * ih * 0.4;
        const th = ih * (0.6 + Math.sin(i * 2.7) * 0.3);
        const sw = Math.sin(time * 1.2 + i * 1.5) * 2;
        ctx!.fillStyle = `rgba(13, ${80 + Math.floor(Math.sin(i * 1.3) * 20)}, ${45 + Math.floor(Math.sin(i * 2.1) * 15)}, 0.5)`;
        ctx!.beginPath();
        ctx!.moveTo(tx - 4, tby);
        ctx!.quadraticCurveTo(tx + sw, tby - th, tx + 4, tby);
        ctx!.fill();
      }

      // Animated surf / foam
      for (let ring = 0; ring < 4; ring++) {
        const phase = time * 1.2 + ring * 1.6;
        const breathe = Math.sin(phase) * 0.5 + 0.5;
        const ringScale = 1.02 + ring * 0.03 + breathe * 0.03;
        const foamAlpha = (1 - breathe) * 0.35 * (1 - ring * 0.2);
        ctx!.strokeStyle = `rgba(220, 245, 255, ${foamAlpha})`;
        ctx!.lineWidth = 2.5 - ring * 0.4;
        ctx!.beginPath();
        for (let j = 0; j <= 60; j++) {
          const a = (j / 60) * Math.PI * 2;
          const waveOff = Math.sin(a * 8 + time * 2 + ring) * ih * 0.08;
          const rx = iw * ringScale;
          const ry = (ih * 0.7 + ring * ih * 0.2) * ringScale;
          const px = cx + Math.cos(a) * rx;
          const py = baseY + Math.sin(a) * ry + waveOff;
          if (j === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        }
        ctx!.stroke();
        if (ring < 2) {
          ctx!.strokeStyle = `rgba(44, 143, 123, ${foamAlpha * 0.25})`;
          ctx!.lineWidth = 5;
          ctx!.stroke();
        }
      }

      // Foam speckles
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const dist = 1.02 + Math.sin(time * 1.5 + i * 3) * 0.02;
        const fx = cx + Math.cos(angle) * iw * dist;
        const fy = baseY + Math.sin(angle) * ih * 0.8 * dist;
        const sa = 0.15 + Math.sin(time * 3 + i * 5) * 0.15;
        ctx!.fillStyle = `rgba(255, 255, 255, ${Math.max(0, sa)})`;
        ctx!.beginPath();
        ctx!.arc(fx, fy, 1.5 + Math.sin(time + i) * 0.8, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    // ── Draw: Palm frond (detailed) ──────────────────────────────────
    function drawPalmFrond(cx: number, cy: number, angle: number, length: number, curve: number, swayOffset: number) {
      const segments = 20;
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(angle + swayOffset);

      ctx!.strokeStyle = '#0b5e34';
      ctx!.lineWidth = Math.max(1, length * 0.03);
      ctx!.beginPath();
      ctx!.moveTo(0, 0);
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        ctx!.lineTo(t * length, Math.sin(t * Math.PI * curve) * length * 0.15);
      }
      ctx!.stroke();

      for (let i = 2; i <= segments; i++) {
        const t = i / segments;
        const x = t * length;
        const y = Math.sin(t * Math.PI * curve) * length * 0.15;
        const ll = length * 0.18 * (1 - t * 0.5);
        const grad = ctx!.createLinearGradient(x, y, x, y - ll);
        grad.addColorStop(0, COLORS.palmFrond);
        grad.addColorStop(1, 'rgba(13, 107, 58, 0.2)');
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.moveTo(x, y);
        ctx!.quadraticCurveTo(x + ll * 0.3, y - ll * 0.7, x + ll * 0.1, y - ll);
        ctx!.quadraticCurveTo(x - ll * 0.1, y - ll * 0.5, x, y);
        ctx!.fill();
        ctx!.beginPath();
        ctx!.moveTo(x, y);
        ctx!.quadraticCurveTo(x + ll * 0.3, y + ll * 0.7, x + ll * 0.1, y + ll);
        ctx!.quadraticCurveTo(x - ll * 0.1, y + ll * 0.5, x, y);
        ctx!.fill();
      }
      ctx!.restore();
    }

    // ── Draw: Palm frond (silhouette) ────────────────────────────────
    function drawSilhouetteFrond(cx: number, cy: number, angle: number, length: number, curve: number, swayOffset: number) {
      const segments = 20;
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(angle + swayOffset);
      ctx!.fillStyle = '#050e0a';
      ctx!.beginPath();
      ctx!.moveTo(0, 0);
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = t * length;
        const y = Math.sin(t * Math.PI * curve) * length * 0.15;
        const ll = length * 0.18 * (1 - t * 0.5);
        ctx!.lineTo(x, y - ll * 0.85);
      }
      ctx!.lineTo(length, Math.sin(Math.PI * curve) * length * 0.15);
      for (let i = segments; i >= 0; i--) {
        const t = i / segments;
        const x = t * length;
        const y = Math.sin(t * Math.PI * curve) * length * 0.15;
        const ll = length * 0.18 * (1 - t * 0.5);
        ctx!.lineTo(x, y + ll * 0.85);
      }
      ctx!.closePath();
      ctx!.fill();
      ctx!.restore();
    }

    // ── Draw: Palm tree ──────────────────────────────────────────────
    function drawPalmTree(x: number, y: number, height: number, sway: number, leanAngle: number, silhouette: boolean) {
      const trunkW = height * 0.04;
      ctx!.save();
      ctx!.translate(x, y);
      ctx!.rotate(leanAngle);

      if (silhouette) {
        ctx!.fillStyle = '#050e0a';
        ctx!.beginPath();
        ctx!.moveTo(-trunkW, 0);
        ctx!.lineTo(trunkW, 0);
        ctx!.lineTo(trunkW * 0.6, -height);
        ctx!.lineTo(-trunkW * 0.6, -height);
        ctx!.closePath();
        ctx!.fill();
      } else {
        for (let i = 0; i < 15; i++) {
          const t1 = i / 15, t2 = (i + 1) / 15;
          const w1 = trunkW * (1 - t1 * 0.4);
          const w2 = trunkW * (1 - t2 * 0.4);
          const shade = 0.3 + (i % 2 === 0 ? 0 : 0.08);
          ctx!.fillStyle = `rgba(26, 48, 37, ${shade + 0.4})`;
          ctx!.beginPath();
          ctx!.moveTo(-w1, -t1 * height);
          ctx!.lineTo(w1, -t1 * height);
          ctx!.lineTo(w2, -t2 * height);
          ctx!.lineTo(-w2, -t2 * height);
          ctx!.closePath();
          ctx!.fill();
        }
      }

      const frondLen = height * 0.55;
      const drawFn = silhouette ? drawSilhouetteFrond : drawPalmFrond;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const curvature = 0.8 + Math.sin(i * 1.3) * 0.3;
        drawFn(0, -height, angle, frondLen, curvature, sway * (0.8 + Math.sin(i) * 0.3));
      }

      if (!silhouette) {
        ctx!.fillStyle = '#5a3a1a';
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2;
          ctx!.beginPath();
          ctx!.arc(Math.cos(angle) * trunkW * 1.5, -height + Math.sin(angle) * trunkW + trunkW, height * 0.02, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
      ctx!.restore();
    }

    // ── Draw: Parrot ─────────────────────────────────────────────────
    function drawParrot(p: ParrotData, time: number) {
      const t = time + p.delay;
      const x = (p.baseX + Math.sin(p.driftPhase + t * 0.3) * 0.03) * W;
      const y = (p.baseY + Math.sin(t * 0.5) * 0.015 + Math.cos(t * 0.7) * 0.008) * H;
      const s = p.size * Math.min(W, H) * 0.001;
      const wingAngle = Math.sin(t * 6 + p.flapPhase) * 0.6;

      ctx!.save();
      ctx!.translate(x, y);

      // Body
      ctx!.fillStyle = COLORS.parrotBody;
      ctx!.beginPath();
      ctx!.ellipse(0, 0, s * 3, s * 1.2, 0.1, 0, Math.PI * 2);
      ctx!.fill();

      // Head
      ctx!.fillStyle = '#ff8c42';
      ctx!.beginPath();
      ctx!.arc(s * 2.5, -s * 0.4, s * 1.1, 0, Math.PI * 2);
      ctx!.fill();

      // Eye
      ctx!.fillStyle = '#fff';
      ctx!.beginPath();
      ctx!.arc(s * 2.9, -s * 0.6, s * 0.3, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = '#111';
      ctx!.beginPath();
      ctx!.arc(s * 3.0, -s * 0.6, s * 0.15, 0, Math.PI * 2);
      ctx!.fill();

      // Beak
      ctx!.fillStyle = COLORS.parrotBeak;
      ctx!.beginPath();
      ctx!.moveTo(s * 3.5, -s * 0.3);
      ctx!.lineTo(s * 4.2, -s * 0.1);
      ctx!.lineTo(s * 3.5, s * 0.2);
      ctx!.closePath();
      ctx!.fill();

      // Wings
      ctx!.save();
      ctx!.translate(0, -s * 0.3);
      ctx!.rotate(wingAngle);
      ctx!.fillStyle = COLORS.parrotWing;
      ctx!.beginPath();
      ctx!.ellipse(-s * 0.5, -s * 1, s * 2.5, s * 1, -0.3, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = 'rgba(44, 143, 123, 0.5)';
      ctx!.beginPath();
      ctx!.ellipse(-s * 0.2, -s * 0.6, s * 1.8, s * 0.7, -0.3, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();

      // Tail
      ctx!.fillStyle = '#2c8f7b';
      ctx!.beginPath();
      ctx!.moveTo(-s * 2.5, s * 0.2);
      ctx!.quadraticCurveTo(-s * 4, s * 0.8, -s * 5, s * 1.5);
      ctx!.quadraticCurveTo(-s * 4, s * 0.3, -s * 2.5, -s * 0.3);
      ctx!.closePath();
      ctx!.fill();
      ctx!.fillStyle = '#ff6b35';
      ctx!.beginPath();
      ctx!.moveTo(-s * 2.5, s * 0);
      ctx!.quadraticCurveTo(-s * 3.8, s * 0.5, -s * 4.5, s * 1.8);
      ctx!.quadraticCurveTo(-s * 3.5, s * 0.5, -s * 2.5, -s * 0.2);
      ctx!.closePath();
      ctx!.fill();

      ctx!.restore();
    }

    // ── Draw: Particles with glow ────────────────────────────────────
    function drawParticles(time: number) {
      for (const p of PARTICLES) {
        const alpha = 0.2 + Math.sin(time * 2 + p.phase) * 0.2;
        const x = (p.x + Math.sin(time * 0.5 + p.phase) * 0.02) * W;
        const y = (p.y + Math.cos(time * 0.3 + p.phase) * 0.01) * H;
        const a = Math.max(0, alpha);

        // Glow halo
        const gr = p.size * 5;
        const gg = ctx!.createRadialGradient(x, y, 0, x, y, gr);
        gg.addColorStop(0, `rgba(44, 143, 123, ${a * 0.25})`);
        gg.addColorStop(1, 'rgba(44, 143, 123, 0)');
        ctx!.fillStyle = gg;
        ctx!.beginPath();
        ctx!.arc(x, y, gr, 0, Math.PI * 2);
        ctx!.fill();

        // Core
        ctx!.fillStyle = `rgba(44, 143, 123, ${a})`;
        ctx!.beginPath();
        ctx!.arc(x, y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    // ── Draw: Foreground depth gradient ──────────────────────────────
    function drawForegroundDepth() {
      const gradH = H * 0.12;
      const grad = ctx!.createLinearGradient(0, H - gradH, 0, H);
      grad.addColorStop(0, 'rgba(3, 10, 18, 0)');
      grad.addColorStop(0.6, 'rgba(3, 10, 18, 0.3)');
      grad.addColorStop(1, 'rgba(3, 10, 18, 0.6)');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, H - gradH, W, gradH);
    }

    // ── Draw: Vignette ───────────────────────────────────────────────
    function drawVignette() {
      const vg = ctx!.createRadialGradient(W * 0.5, H * 0.5, W * 0.2, W * 0.5, H * 0.5, W * 0.7);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx!.fillStyle = vg;
      ctx!.fillRect(0, 0, W, H);
    }

    // ── Draw: Scanlines ──────────────────────────────────────────────
    function drawScanlines() {
      const pat = getScanlinePattern();
      if (pat) {
        ctx!.fillStyle = pat;
        ctx!.fillRect(0, 0, W, H);
      }
    }

    // ── Main draw loop ───────────────────────────────────────────────
    function draw(t: number) {
      const time = t * 0.001;
      ctx!.clearRect(0, 0, W, H);

      const sway = Math.sin(time) * 0.04;

      // Layer 1: Sky
      drawSky(time);
      drawStars(time);
      drawShootingStars(time);
      drawClouds();
      drawDistantBirds(time);

      // Layer 2: Sun + horizon atmosphere
      drawSun(time);
      drawAtmosphericHaze(time);
      drawHorizonGlow(time);

      // Layer 3: Ocean
      drawOcean(time);

      // Layer 4: Island
      drawIsland(time);

      // Layer 5: Island palm trees
      const baseY = H * 0.50;
      drawPalmTree(W * 0.42, baseY, H * 0.22, sway, -0.15, false);
      drawPalmTree(W * 0.50, baseY - H * 0.01, H * 0.28, sway * 0.8, 0.05, false);
      drawPalmTree(W * 0.57, baseY, H * 0.20, sway * 1.1, 0.18, false);

      // Layer 6: Parrots
      for (const p of PARROTS) drawParrot(p, time);

      // Layer 7: Particles
      drawParticles(time);

      // Layer 8: Foreground silhouette palms
      ctx!.globalAlpha = 0.85;
      drawPalmTree(W * 0.05, H * 0.85, H * 0.45, sway * 0.6, -0.2, true);
      drawPalmTree(W * 0.92, H * 0.88, H * 0.42, sway * 0.7, 0.15, true);
      ctx!.globalAlpha = 1;

      // Layer 9: Foreground depth
      drawForegroundDepth();

      // Layer 10: Post-processing
      drawVignette();
      drawScanlines();

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="tropical-bg-wrap"
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
