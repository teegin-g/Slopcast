/**
 * MoonlightBackground – animated HTML5 Canvas backdrop for the 'league' (Nocturne) theme.
 *
 * Renders a moonlit alpine scene inspired by the reference image:
 *   - Deep blue sky with subtle horizontal atmospheric bands
 *   - Aurora-like neon wave bands at the top (green, amber, red, blue)
 *   - Warm golden moon with layered glow rings
 *   - Amber/teal horizon haze with drifting cloud layers
 *   - Dark mountain silhouettes (3 layers) with faint contour lines
 *   - Twinkling stars
 *   - Atmospheric mist particles
 *   - Film grain + vignette post-processing
 *
 * Positioned as a fixed full-viewport layer behind all content (z-index: -1).
 */
import { useEffect, useRef } from 'react';

// ── Color palette (derived from league theme + reference image) ─────────
const COLORS = {
  skyTop: '#040810',
  skyMid: '#0a1628',
  skyLow: '#0e2040',
  horizon: '#1a3454',
  moonBody: '#e9b067',
  moonGlow1: 'rgba(244, 210, 164, 0.42)',
  moonGlow2: 'rgba(166, 196, 235, 0.16)',
  moonGlow3: 'rgba(103, 195, 238, 0.09)',
  auroraGreen: '#22cc66',
  auroraAmber: '#e09030',
  auroraRed: '#cc3030',
  auroraCyan: '#3388dd',
  auroraTeal: '#20aa88',
  horizonWarm: '#c08040',
  horizonTeal: '#3a8899',
  horizonPale: '#7bacb8',
  mountainFar: '#0a1a2e',
  mountainMid: '#060e1a',
  mountainNear: '#030810',
  contourGold: 'rgba(233, 176, 103, 0.18)',
  contourBlue: 'rgba(103, 195, 238, 0.14)',
  starWhite: '#d4e4ff',
  starWarm: '#f4d2a4',
  mistBase: 'rgba(100, 160, 200, 0.03)',
  pineSilhouette: '#02060c',
  valleyLamp: '#e9b067',
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// ── Star data (pre-generated for determinism) ───────────────────────────
function generateStars(count: number, seed: number) {
  const stars: { x: number; y: number; r: number; brightness: number; speed: number; color: string }[] = [];
  const rand = seededRandom(seed);
  const colors = [COLORS.starWhite, COLORS.starWarm, '#e0e8ff', '#ffd6ff', '#d4f0ff'];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand(),
      y: rand() * 0.55,       // stars only in upper 55%
      r: 0.5 + rand() * 1.8,
      brightness: 0.3 + rand() * 0.7,
      speed: 0.3 + rand() * 2.0,
      color: colors[Math.floor(rand() * colors.length)],
    });
  }
  return stars;
}

// ── Aurora wave band data ───────────────────────────────────────────────
function generateAuroraBands() {
  return [
    { y: 0.04, amplitude: 8,  freq: 0.003, speed: 0.15, color: COLORS.auroraGreen, width: 2.0, opacity: 0.55 },
    { y: 0.06, amplitude: 10, freq: 0.004, speed: 0.12, color: COLORS.auroraAmber, width: 2.2, opacity: 0.50 },
    { y: 0.08, amplitude: 7,  freq: 0.005, speed: 0.18, color: COLORS.auroraGreen, width: 1.8, opacity: 0.45 },
    { y: 0.10, amplitude: 12, freq: 0.003, speed: 0.10, color: COLORS.auroraRed,   width: 2.5, opacity: 0.42 },
    { y: 0.12, amplitude: 9,  freq: 0.006, speed: 0.14, color: COLORS.auroraAmber, width: 1.6, opacity: 0.40 },
    { y: 0.14, amplitude: 11, freq: 0.004, speed: 0.20, color: COLORS.auroraTeal,  width: 2.0, opacity: 0.38 },
    { y: 0.16, amplitude: 6,  freq: 0.005, speed: 0.16, color: COLORS.auroraCyan,  width: 1.5, opacity: 0.35 },
    { y: 0.18, amplitude: 8,  freq: 0.007, speed: 0.11, color: COLORS.auroraGreen, width: 1.8, opacity: 0.30 },
    { y: 0.20, amplitude: 10, freq: 0.003, speed: 0.22, color: COLORS.auroraAmber, width: 2.0, opacity: 0.28 },
    { y: 0.22, amplitude: 5,  freq: 0.006, speed: 0.13, color: COLORS.auroraCyan,  width: 1.4, opacity: 0.22 },
  ];
}

// ── Mist particle data ──────────────────────────────────────────────────
function generateMistParticles(count: number) {
  const particles: { x: number; y: number; size: number; speed: number; opacity: number; drift: number }[] = [];
  const rand = seededRandom(123);
  for (let i = 0; i < count; i++) {
    particles.push({
      x: rand(),
      y: 0.40 + rand() * 0.26,  // layered around horizon and ridge passes
      size: 120 + rand() * 260,
      speed: 0.0015 + rand() * 0.004,
      opacity: 0.012 + rand() * 0.035,
      drift: rand() * Math.PI * 2,
    });
  }
  return particles;
}

function generateValleyLights(count: number) {
  const rand = seededRandom(909);
  const lights: { x: number; y: number; r: number; phase: number; warmth: number }[] = [];
  for (let i = 0; i < count; i++) {
    lights.push({
      x: 0.16 + rand() * 0.70,
      y: 0.66 + rand() * 0.13,
      r: 1.4 + rand() * 2.8,
      phase: rand() * Math.PI * 2,
      warmth: 0.55 + rand() * 0.45,
    });
  }
  return lights;
}

const STARS = generateStars(140, 42);
const AURORA_BANDS = generateAuroraBands();
const MIST = generateMistParticles(25);
const VALLEY_LIGHTS = generateValleyLights(24);

export default function MoonlightBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number;

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduceMotion = motionQuery?.matches ?? false;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth * dpr;
      H = window.innerHeight * dpr;
      canvas!.width = W;
      canvas!.height = H;
      if (reduceMotion) draw(0);
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Pre-computed mountain paths (fractions of W/H) ────────────────
    // Far mountains
    const farMtn = [
      [0, 0.57], [0.06, 0.54], [0.12, 0.58], [0.18, 0.52], [0.25, 0.56],
      [0.32, 0.50], [0.38, 0.55], [0.44, 0.49], [0.50, 0.54], [0.56, 0.48],
      [0.62, 0.53], [0.68, 0.47], [0.74, 0.52], [0.80, 0.46], [0.86, 0.51],
      [0.92, 0.53], [1.0, 0.49],
    ];
    // Mid mountains
    const midMtn = [
      [0, 0.63], [0.05, 0.58], [0.10, 0.62], [0.16, 0.55], [0.22, 0.60],
      [0.28, 0.54], [0.35, 0.61], [0.42, 0.53], [0.48, 0.58], [0.55, 0.52],
      [0.62, 0.58], [0.68, 0.51], [0.75, 0.57], [0.82, 0.53], [0.88, 0.59],
      [0.94, 0.55], [1.0, 0.58],
    ];
    // Near mountains (very dark, large foreground)
    const nearMtn = [
      [0, 0.76], [0.08, 0.68], [0.15, 0.72], [0.22, 0.62], [0.30, 0.69],
      [0.38, 0.74], [0.45, 0.64], [0.52, 0.70], [0.58, 0.63], [0.65, 0.69],
      [0.72, 0.61], [0.78, 0.68], [0.85, 0.58], [0.92, 0.66], [1.0, 0.63],
    ];

    function drawMountainPath(points: number[][], close: boolean) {
      ctx!.beginPath();
      ctx!.moveTo(points[0][0] * W, points[0][1] * H);
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev[0] + curr[0]) / 2 * W;
        const cpy = (prev[1] + curr[1]) / 2 * H;
        ctx!.quadraticCurveTo(prev[0] * W, prev[1] * H, cpx, cpy);
      }
      const last = points[points.length - 1];
      ctx!.lineTo(last[0] * W, last[1] * H);
      if (close) {
        ctx!.lineTo(W, H);
        ctx!.lineTo(0, H);
        ctx!.closePath();
      }
    }

    // ── Draw functions ────────────────────────────────────────────────

    function drawSky() {
      const grad = ctx!.createLinearGradient(0, 0, 0, H * 0.65);
      grad.addColorStop(0, COLORS.skyTop);
      grad.addColorStop(0.3, COLORS.skyMid);
      grad.addColorStop(0.65, COLORS.skyLow);
      grad.addColorStop(1.0, COLORS.horizon);
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);
    }

    function drawHorizonHaze(time: number) {
      // Warm amber/teal horizon glow
      const hY = H * 0.50;
      const hH = H * 0.28;

      // Teal base
      const g1 = ctx!.createLinearGradient(0, hY - hH * 0.3, 0, hY + hH);
      g1.addColorStop(0, 'rgba(58, 136, 153, 0)');
      g1.addColorStop(0.28, 'rgba(86, 137, 174, 0.10)');
      g1.addColorStop(0.50, 'rgba(166, 196, 235, 0.14)');
      g1.addColorStop(0.72, 'rgba(192, 128, 64, 0.16)');
      g1.addColorStop(1.0, 'rgba(192, 128, 64, 0)');
      ctx!.fillStyle = g1;
      ctx!.fillRect(0, hY - hH * 0.3, W, hH * 1.3);

      // Drifting cloud layers
      const cloudCount = 7;
      for (let i = 0; i < cloudCount; i++) {
        const cy = hY + (i / cloudCount) * hH * 0.8;
        const drift = Math.sin(time * 0.045 + i * 1.5) * W * 0.025;
        const alpha = 0.045 + Math.sin(time * 0.04 + i) * 0.012;

        const cg = ctx!.createLinearGradient(drift, 0, W + drift, 0);
        cg.addColorStop(0, `rgba(192, 128, 64, 0)`);
        cg.addColorStop(0.2, `rgba(192, 128, 64, ${alpha})`);
        cg.addColorStop(0.5, `rgba(244, 210, 164, ${alpha * 1.5})`);
        cg.addColorStop(0.8, `rgba(192, 128, 64, ${alpha})`);
        cg.addColorStop(1, `rgba(192, 128, 64, 0)`);
        ctx!.fillStyle = cg;
        ctx!.fillRect(0, cy - 8, W, 16);
      }
    }

    function drawAtmosphericBands(time: number) {
      // Moonlit fog bands, not neon scanlines, keep Nocturne distinct from Synthwave.
      const bandCount = 16;
      for (let i = 0; i < bandCount; i++) {
        const yFrac = 0.30 + (i / bandCount) * 0.28;
        const y = yFrac * H;
        const alpha = 0.024 + Math.sin(time * 0.055 + i * 0.7) * 0.010;
        ctx!.strokeStyle = `rgba(166, 196, 235, ${alpha})`;
        ctx!.lineWidth = i % 3 === 0 ? 2 : 1;
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(W, y);
        ctx!.stroke();
      }
    }

    function drawAurora(time: number) {
      for (const band of AURORA_BANDS) {
        const y0 = (band.y + 0.04) * H;
        ctx!.strokeStyle = band.color;
        ctx!.lineWidth = band.width * 1.35 * (W / 1920);
        ctx!.globalAlpha = band.opacity * 0.72 * (0.7 + 0.3 * Math.sin(time * 0.14 + band.y * 30));
        ctx!.beginPath();
        for (let x = 0; x <= W; x += 5) {
          const curtain = Math.sin((x / W) * Math.PI * 5 + time * band.speed * 0.8);
          const wave1 = Math.sin(x * band.freq + time * band.speed) * band.amplitude;
          const wave2 = Math.sin(x * band.freq * 1.7 + time * band.speed * 0.65 + 2.0) * band.amplitude * 0.5;
          const yPos = y0 + (wave1 + wave2) * (H / 1080) + curtain * H * 0.010;
          if (x === 0) ctx!.moveTo(x, yPos);
          else ctx!.lineTo(x, yPos);
        }
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }
    }

    function drawMoon(time: number) {
      const mx = W * 0.68;
      const my = H * 0.22;
      const mr = Math.min(W, H) * 0.072;

      // Outer glow rings (pulsing)
      const pulse = 1 + Math.sin(time * 0.3) * 0.06;

      // Large diffuse glow
      const g3 = ctx!.createRadialGradient(mx, my, 0, mx, my, mr * 12 * pulse);
      g3.addColorStop(0, 'rgba(244, 210, 164, 0.12)');
      g3.addColorStop(0.45, 'rgba(103, 195, 238, 0.06)');
      g3.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx!.fillStyle = g3;
      ctx!.fillRect(mx - mr * 14, my - mr * 14, mr * 28, mr * 28);

      // Diagonal moon rays rake across the war-room background without covering panels.
      ctx!.save();
      ctx!.globalCompositeOperation = 'screen';
      ctx!.translate(mx, my);
      ctx!.rotate(-0.34);
      for (let i = 0; i < 3; i++) {
        const rayY = (i - 1) * mr * 1.4;
        const ray = ctx!.createLinearGradient(0, rayY, -W * 0.72, rayY + H * 0.12);
        ray.addColorStop(0, 'rgba(244, 210, 164, 0.13)');
        ray.addColorStop(0.38, 'rgba(166, 196, 235, 0.055)');
        ray.addColorStop(1, 'rgba(166, 196, 235, 0)');
        ctx!.fillStyle = ray;
        ctx!.fillRect(-W * 0.78, rayY - mr * 0.18, W * 0.90, mr * 0.36);
      }
      ctx!.restore();

      // Medium glow
      const g2 = ctx!.createRadialGradient(mx, my, 0, mx, my, mr * 5 * pulse);
      g2.addColorStop(0, 'rgba(244, 210, 164, 0.20)');
      g2.addColorStop(0.5, 'rgba(233, 176, 103, 0.08)');
      g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx!.fillStyle = g2;
      ctx!.fillRect(mx - mr * 6, my - mr * 6, mr * 12, mr * 12);

      // Inner glow
      const g1 = ctx!.createRadialGradient(mx, my, 0, mx, my, mr * 2.5);
      g1.addColorStop(0, 'rgba(244, 220, 180, 0.45)');
      g1.addColorStop(0.6, 'rgba(233, 176, 103, 0.15)');
      g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx!.fillStyle = g1;
      ctx!.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6);

      // Moon body
      const bodyGrad = ctx!.createRadialGradient(mx - mr * 0.15, my - mr * 0.15, 0, mx, my, mr);
      bodyGrad.addColorStop(0, '#f8dca8');
      bodyGrad.addColorStop(0.5, '#e9b067');
      bodyGrad.addColorStop(0.85, '#d89540');
      bodyGrad.addColorStop(1, '#c07828');
      ctx!.fillStyle = bodyGrad;
      ctx!.beginPath();
      ctx!.arc(mx, my, mr, 0, Math.PI * 2);
      ctx!.fill();

      // Subtle surface texture on moon
      ctx!.globalAlpha = 0.15;
      ctx!.fillStyle = '#a07030';
      ctx!.beginPath();
      ctx!.arc(mx + mr * 0.2, my - mr * 0.15, mr * 0.18, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(mx - mr * 0.25, my + mr * 0.2, mr * 0.14, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(mx + mr * 0.05, my + mr * 0.35, mr * 0.10, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.globalAlpha = 1;
    }

    function drawStars(time: number) {
      for (const star of STARS) {
        const twinkle = 0.4 + 0.6 * Math.sin(time * star.speed + star.x * 100 + star.y * 50);
        const alpha = star.brightness * twinkle;
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = star.color;
        ctx!.beginPath();
        ctx!.arc(star.x * W, star.y * H, star.r * (W / 1920), 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function drawMountains() {
      // Far mountains
      ctx!.fillStyle = COLORS.mountainFar;
      drawMountainPath(farMtn, true);
      ctx!.fill();

      // Far mountain contour lines
      ctx!.strokeStyle = COLORS.contourBlue;
      ctx!.lineWidth = 1;
      for (let offset = 0.02; offset < 0.10; offset += 0.025) {
        const shifted = farMtn.map(p => [p[0], p[1] + offset]);
        drawMountainPath(shifted, false);
        ctx!.globalAlpha = 0.12 - offset * 0.8;
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;

      // Mid mountains
      ctx!.fillStyle = COLORS.mountainMid;
      drawMountainPath(midMtn, true);
      ctx!.fill();

      // Mid mountain ridge contours
      ctx!.strokeStyle = COLORS.contourGold;
      ctx!.lineWidth = 1;
      for (let offset = 0.015; offset < 0.08; offset += 0.02) {
        const shifted = midMtn.map(p => [p[0], p[1] + offset]);
        drawMountainPath(shifted, false);
        ctx!.globalAlpha = 0.14 - offset * 1.2;
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;

      drawValleyLights();

      // Near mountains
      ctx!.fillStyle = COLORS.mountainNear;
      drawMountainPath(nearMtn, true);
      ctx!.fill();

      // Near mountain subtle ridge lines (like the trails in the reference)
      ctx!.lineWidth = 1.2;
      for (let offset = 0.02; offset < 0.12; offset += 0.025) {
        const shifted = nearMtn.map(p => [p[0], p[1] + offset]);
        drawMountainPath(shifted, false);
        ctx!.strokeStyle = `rgba(233, 176, 103, ${0.06 - offset * 0.35})`;
        ctx!.stroke();
      }
    }

    function drawValleyLights() {
      for (const light of VALLEY_LIGHTS) {
        const x = light.x * W;
        const y = light.y * H;
        const r = light.r * (W / 1920);
        const glow = ctx!.createRadialGradient(x, y, 0, x, y, r * 10);
        glow.addColorStop(0, `rgba(233, 176, 103, ${0.34 * light.warmth})`);
        glow.addColorStop(0.28, `rgba(233, 176, 103, ${0.12 * light.warmth})`);
        glow.addColorStop(1, 'rgba(233, 176, 103, 0)');
        ctx!.fillStyle = glow;
        ctx!.fillRect(x - r * 10, y - r * 10, r * 20, r * 20);
        ctx!.fillStyle = `rgba(244, 210, 164, ${0.38 + 0.30 * light.warmth})`;
        ctx!.beginPath();
        ctx!.arc(x, y, Math.max(1, r), 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawMist(time: number) {
      for (const p of MIST) {
        const x = ((p.x + time * p.speed) % 1.4 - 0.2) * W;
        const y = p.y * H + Math.sin(time * 0.15 + p.drift) * H * 0.01;
        const grad = ctx!.createRadialGradient(x, y, 0, x, y, p.size * (W / 1920));
        const alpha = p.opacity * (0.6 + 0.4 * Math.sin(time * 0.08 + p.drift));
        grad.addColorStop(0, `rgba(120, 170, 200, ${alpha})`);
        grad.addColorStop(1, 'rgba(120, 170, 200, 0)');
        ctx!.fillStyle = grad;
        ctx!.fillRect(x - p.size, y - p.size, p.size * 2, p.size * 2);
      }
    }

    function drawForegroundSilhouettes() {
      ctx!.fillStyle = COLORS.pineSilhouette;

      function drawPine(x: number, baseY: number, h: number, lean: number) {
        const w = h * 0.28;
        ctx!.save();
        ctx!.translate(x, baseY);
        ctx!.rotate(lean);
        ctx!.fillRect(-w * 0.05, -h * 0.48, w * 0.10, h * 0.48);
        for (let i = 0; i < 5; i++) {
          const y = -h * (0.18 + i * 0.14);
          const tierW = w * (1 - i * 0.12);
          ctx!.beginPath();
          ctx!.moveTo(0, y - h * 0.18);
          ctx!.lineTo(-tierW, y + h * 0.10);
          ctx!.lineTo(tierW, y + h * 0.10);
          ctx!.closePath();
          ctx!.fill();
        }
        ctx!.restore();
      }

      for (let i = 0; i < 7; i++) {
        drawPine(W * (0.015 + i * 0.035), H * (0.96 - i * 0.018), H * (0.20 + i * 0.018), -0.035);
        drawPine(W * (0.985 - i * 0.038), H * (0.95 - i * 0.014), H * (0.18 + i * 0.015), 0.032);
      }

      ctx!.beginPath();
      ctx!.moveTo(0, H * 0.90);
      ctx!.quadraticCurveTo(W * 0.18, H * 0.82, W * 0.36, H * 0.88);
      ctx!.quadraticCurveTo(W * 0.52, H * 0.94, W * 0.72, H * 0.84);
      ctx!.quadraticCurveTo(W * 0.88, H * 0.78, W, H * 0.86);
      ctx!.lineTo(W, H);
      ctx!.lineTo(0, H);
      ctx!.closePath();
      ctx!.fill();
    }

    function drawVignette() {
      const grad = ctx!.createRadialGradient(W * 0.5, H * 0.38, W * 0.2, W * 0.5, H * 0.5, W * 0.85);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
      grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.45)');
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.70)');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);
    }

    function drawGrain() {
      ctx!.globalAlpha = 0.04;
      const imgData = ctx!.createImageData(64, 64);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 30;
      }
      // Tile the noise
      const pattern = ctx!.createPattern(
        (() => {
          const c = document.createElement('canvas');
          c.width = 64;
          c.height = 64;
          const cx2 = c.getContext('2d')!;
          cx2.putImageData(imgData, 0, 0);
          return c;
        })(),
        'repeat'
      );
      if (pattern) {
        ctx!.fillStyle = pattern;
        ctx!.fillRect(0, 0, W, H);
      }
      ctx!.globalAlpha = 1;
    }

    // ── Main draw loop ────────────────────────────────────────────────
    function draw(t: number) {
      const time = t * 0.001;
      ctx!.clearRect(0, 0, W, H);

      drawSky();
      drawStars(time);
      drawAtmosphericBands(time);
      drawAurora(time);
      drawMoon(time);
      drawHorizonHaze(time);
      drawMountains();
      drawMist(time);
      drawForegroundSilhouettes();
      drawGrain();
      drawVignette();

      if (reduceMotion) return;
      rafRef.current = requestAnimationFrame(draw);
    }

    const handleMotionChange = () => {
      reduceMotion = motionQuery?.matches ?? false;
      cancelAnimationFrame(rafRef.current);
      if (reduceMotion) {
        draw(0);
      } else {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    if (motionQuery) {
      if (motionQuery.addEventListener) motionQuery.addEventListener('change', handleMotionChange);
      else motionQuery.addListener(handleMotionChange);
    }

    if (reduceMotion) {
      draw(0);
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
      if (motionQuery) {
        if (motionQuery.removeEventListener) motionQuery.removeEventListener('change', handleMotionChange);
        else motionQuery.removeListener(handleMotionChange);
      }
    };
  }, []);

  return (
    <div
      className="moonlight-bg-wrap"
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
