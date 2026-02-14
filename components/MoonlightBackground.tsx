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
  moonGlow1: 'rgba(233, 176, 103, 0.35)',
  moonGlow2: 'rgba(244, 210, 164, 0.12)',
  moonGlow3: 'rgba(103, 195, 238, 0.06)',
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
};

// ── Star data (pre-generated for determinism) ───────────────────────────
function generateStars(count: number, seed: number) {
  const stars: { x: number; y: number; r: number; brightness: number; speed: number; color: string }[] = [];
  let s = seed;
  const rand = () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
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
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random(),
      y: 0.38 + Math.random() * 0.22,  // around horizon area
      size: 80 + Math.random() * 200,
      speed: 0.002 + Math.random() * 0.006,
      opacity: 0.01 + Math.random() * 0.04,
      drift: Math.random() * Math.PI * 2,
    });
  }
  return particles;
}

const STARS = generateStars(140, 42);
const AURORA_BANDS = generateAuroraBands();
const MIST = generateMistParticles(25);

export default function MoonlightBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth * dpr;
      H = window.innerHeight * dpr;
      canvas!.width = W;
      canvas!.height = H;
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Pre-computed mountain paths (fractions of W/H) ────────────────
    // Far mountains
    const farMtn = [
      [0, 0.56], [0.06, 0.54], [0.12, 0.57], [0.18, 0.53], [0.25, 0.56],
      [0.32, 0.52], [0.38, 0.55], [0.44, 0.51], [0.50, 0.54], [0.56, 0.50],
      [0.62, 0.53], [0.68, 0.49], [0.74, 0.52], [0.80, 0.48], [0.86, 0.51],
      [0.92, 0.53], [1.0, 0.50],
    ];
    // Mid mountains
    const midMtn = [
      [0, 0.62], [0.05, 0.58], [0.10, 0.61], [0.16, 0.56], [0.22, 0.59],
      [0.28, 0.55], [0.35, 0.60], [0.42, 0.54], [0.48, 0.58], [0.55, 0.53],
      [0.62, 0.57], [0.68, 0.52], [0.75, 0.56], [0.82, 0.54], [0.88, 0.58],
      [0.94, 0.55], [1.0, 0.57],
    ];
    // Near mountains (very dark, large foreground)
    const nearMtn = [
      [0, 0.72], [0.08, 0.66], [0.15, 0.70], [0.22, 0.63], [0.30, 0.68],
      [0.38, 0.72], [0.45, 0.65], [0.52, 0.70], [0.58, 0.64], [0.65, 0.68],
      [0.72, 0.62], [0.78, 0.67], [0.85, 0.60], [0.92, 0.65], [1.0, 0.62],
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
      const hY = H * 0.42;
      const hH = H * 0.22;

      // Teal base
      const g1 = ctx!.createLinearGradient(0, hY - hH * 0.3, 0, hY + hH);
      g1.addColorStop(0, 'rgba(58, 136, 153, 0)');
      g1.addColorStop(0.3, 'rgba(58, 136, 153, 0.08)');
      g1.addColorStop(0.5, 'rgba(123, 172, 184, 0.12)');
      g1.addColorStop(0.7, 'rgba(192, 128, 64, 0.10)');
      g1.addColorStop(1.0, 'rgba(192, 128, 64, 0)');
      ctx!.fillStyle = g1;
      ctx!.fillRect(0, hY - hH * 0.3, W, hH * 1.3);

      // Drifting cloud layers
      const cloudCount = 5;
      for (let i = 0; i < cloudCount; i++) {
        const cy = hY + (i / cloudCount) * hH * 0.8;
        const drift = Math.sin(time * 0.08 + i * 1.5) * W * 0.02;
        const alpha = 0.04 + Math.sin(time * 0.05 + i) * 0.015;

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
      // Subtle horizontal scan lines in upper sky (cyan tones, like the reference)
      const bandCount = 20;
      for (let i = 0; i < bandCount; i++) {
        const yFrac = 0.24 + (i / bandCount) * 0.18;
        const y = yFrac * H;
        const alpha = 0.02 + Math.sin(time * 0.1 + i * 0.7) * 0.012;
        ctx!.strokeStyle = `rgba(60, 180, 220, ${alpha})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(W, y);
        ctx!.stroke();
      }
    }

    function drawAurora(time: number) {
      for (const band of AURORA_BANDS) {
        const y0 = band.y * H;
        ctx!.strokeStyle = band.color;
        ctx!.lineWidth = band.width * (W / 1920);
        ctx!.globalAlpha = band.opacity * (0.7 + 0.3 * Math.sin(time * 0.2 + band.y * 30));
        ctx!.beginPath();
        for (let x = 0; x <= W; x += 3) {
          const wave1 = Math.sin(x * band.freq + time * band.speed) * band.amplitude;
          const wave2 = Math.sin(x * band.freq * 1.7 + time * band.speed * 0.8 + 2.0) * band.amplitude * 0.5;
          const wave3 = Math.sin(x * band.freq * 0.4 + time * band.speed * 1.3 + 4.5) * band.amplitude * 0.3;
          const yPos = y0 + (wave1 + wave2 + wave3) * (H / 1080);
          if (x === 0) ctx!.moveTo(x, yPos);
          else ctx!.lineTo(x, yPos);
        }
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }
    }

    function drawMoon(time: number) {
      const mx = W * 0.5;
      const my = H * 0.32;
      const mr = Math.min(W, H) * 0.028;

      // Outer glow rings (pulsing)
      const pulse = 1 + Math.sin(time * 0.3) * 0.06;

      // Large diffuse glow
      const g3 = ctx!.createRadialGradient(mx, my, 0, mx, my, mr * 12 * pulse);
      g3.addColorStop(0, 'rgba(233, 176, 103, 0.06)');
      g3.addColorStop(0.4, 'rgba(103, 195, 238, 0.03)');
      g3.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx!.fillStyle = g3;
      ctx!.fillRect(mx - mr * 14, my - mr * 14, mr * 28, mr * 28);

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
      drawGrain();
      drawVignette();

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
