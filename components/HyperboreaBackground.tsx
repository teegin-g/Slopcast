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

// ── Falling Snow ─────────────────────────────────────────────────────────
function generateSnow(count: number) {
  const rand = seededRandom(101);
  const snow: { x: number; y: number; r: number; speedY: number; speedX: number; phase: number }[] = [];
  for (let i = 0; i < count; i++) {
    snow.push({
      x: rand(),
      y: rand(),
      r: rand() * 1.5 + 0.5,
      speedY: rand() * 0.00015 + 0.0001,
      speedX: (rand() - 0.5) * 0.00005,
      phase: rand() * Math.PI * 2,
    });
  }
  return snow;
}

// ── Mountains ──────────────────────────────────────────────────────────
function generateMountains(seed: number, points: number, amp: number) {
  const rand = seededRandom(seed);
  const peaks: number[] = [];
  for (let i = 0; i <= points; i++) {
    peaks.push(rand() * amp);
  }
  return peaks;
}

// ── Mammoths ───────────────────────────────────────────────────────────
interface MammothData {
  baseX: number;
  baseY: number;
  size: number;
  speed: number;
  legPhaseOff: number;
  direction: number; // 1 or -1
}

function generateMammoths(): MammothData[] {
  const rand = seededRandom(404);
  const mams: MammothData[] = [];
  for (let i = 0; i < 3; i++) {
    mams.push({
      baseX: rand() * 1.2 - 0.1,
      baseY: 0.7 + rand() * 0.15,
      size: 0.02 + rand() * 0.015,
      speed: (0.00002 + rand() * 0.00002) * (rand() > 0.5 ? 1 : -1),
      legPhaseOff: rand() * Math.PI * 2,
      direction: 1, // Will be updated dynamically based on speed
    });
  }
  return mams;
}

// ── Pre-generate all static data ─────────────────────────────────────────
const SNOW = generateSnow(200);
const MOUNTAINS_FAR = generateMountains(77, 10, 0.2);
const MOUNTAINS_NEAR = generateMountains(88, 8, 0.15);
const MAMMOTHS = generateMammoths();

export default function HyperboreaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const sunImgRef = useRef<HTMLImageElement | null>(null);

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

    const snowData = SNOW.map(s => ({ ...s }));
    const mammothsData = MAMMOTHS.map(m => ({ ...m, direction: m.speed > 0 ? 1 : -1 }));

    let scanlinePattern: CanvasPattern | null = null;

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
    function drawSky() {
      const grad = ctx!.createLinearGradient(0, 0, 0, H * 0.6);
      grad.addColorStop(0, COLORS.skyTop);
      grad.addColorStop(0.5, COLORS.skyMid);
      grad.addColorStop(0.85, COLORS.skyLow);
      grad.addColorStop(1, COLORS.horizon);
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H * 0.6);
    }

    // ── Draw: Sun (spinning asset) ───────────────────────────────────
    function drawSun(time: number) {
      if (!sunImgRef.current) return;
      const cx = W * 0.5;
      const cy = H * 0.35;
      const size = Math.min(W, H) * 0.45;
      
      // Glow behind sun
      const glowGrad = ctx!.createRadialGradient(cx, cy, size * 0.1, cx, cy, size * 0.8);
      glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      glowGrad.addColorStop(0.3, 'rgba(155, 196, 255, 0.15)');
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = glowGrad;
      ctx!.beginPath();
      ctx!.arc(cx, cy, size * 0.8, 0, Math.PI * 2);
      ctx!.fill();

      // Spinning image
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(time * 0.2); // Spin speed
      ctx!.drawImage(sunImgRef.current, -size / 2, -size / 2, size, size);
      ctx!.restore();
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

    // ── Draw: Nordic Village ─────────────────────────────────────────
    function drawVillage() {
      const baseY = H * 0.58;
      ctx!.fillStyle = COLORS.villageSil;
      
      // Draw a few houses
      const houses = [
        { x: 0.15, w: 0.05, h: 0.04, roofH: 0.03, windows: 2 },
        { x: 0.22, w: 0.06, h: 0.05, roofH: 0.04, windows: 3 },
        { x: 0.29, w: 0.04, h: 0.03, roofH: 0.02, windows: 1 },
        { x: 0.65, w: 0.07, h: 0.06, roofH: 0.04, windows: 3 },
        { x: 0.74, w: 0.05, h: 0.04, roofH: 0.03, windows: 2 },
        { x: 0.81, w: 0.04, h: 0.03, roofH: 0.02, windows: 1 },
      ];

      for (const h of houses) {
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

        // Roof (Nordic steep triangle)
        ctx!.beginPath();
        ctx!.moveTo(hx - hw * 0.1, baseY - hh);
        ctx!.lineTo(hx + hw * 0.5, baseY - hh - hr);
        ctx!.lineTo(hx + hw * 1.1, baseY - hh);
        ctx!.closePath();
        ctx!.fill();

        // Glowing Windows
        ctx!.fillStyle = COLORS.windowGlow;
        const winW = hw * 0.15;
        const winH = hh * 0.3;
        for (let i = 0; i < h.windows; i++) {
          const spacing = hw / (h.windows + 1);
          const wx = hx + spacing * (i + 1) - winW / 2;
          const wy = baseY - hh * 0.6;
          
          ctx!.shadowColor = COLORS.windowGlow;
          ctx!.shadowBlur = 10;
          ctx!.fillRect(wx, wy, winW, winH);
          ctx!.shadowBlur = 0;
        }
        ctx!.fillStyle = COLORS.villageSil;
      }
    }

    // ── Draw: Wooly Mammoths ─────────────────────────────────────────
    function drawMammoths(time: number) {
      for (const m of mammothsData) {
        m.baseX += m.speed * (16.66); // approx dt multiplier
        if (m.baseX > 1.2) m.baseX = -0.2;
        if (m.baseX < -0.2) m.baseX = 1.2;

        const x = m.baseX * W;
        const y = m.baseY * H;
        const s = m.size * W; // uniform scaling based on width
        const walkPhase = time * 3 + m.legPhaseOff;
        
        ctx!.save();
        ctx!.translate(x, y);
        if (m.direction === -1) {
          ctx!.scale(-1, 1);
        }

        ctx!.fillStyle = COLORS.mammothBody;
        
        // Body (humped shape)
        ctx!.beginPath();
        ctx!.ellipse(0, -s, s, s * 0.7, 0, Math.PI, 0); // Back
        ctx!.lineTo(s, 0); // Back leg line
        ctx!.lineTo(-s * 1.2, 0); // Front leg line
        ctx!.closePath();
        ctx!.fill();

        // Legs (animated swinging)
        const legW = s * 0.3;
        const legH = s * 0.8;
        
        // Front leg 1
        const f1Ang = Math.sin(walkPhase) * 0.3;
        ctx!.save();
        ctx!.translate(-s * 0.8, -s * 0.2);
        ctx!.rotate(f1Ang);
        ctx!.fillRect(-legW/2, 0, legW, legH);
        ctx!.restore();
        
        // Front leg 2
        const f2Ang = Math.sin(walkPhase + Math.PI) * 0.3;
        ctx!.save();
        ctx!.translate(-s * 0.5, -s * 0.2);
        ctx!.rotate(f2Ang);
        ctx!.fillRect(-legW/2, 0, legW, legH);
        ctx!.restore();

        // Back leg 1
        const b1Ang = Math.sin(walkPhase + Math.PI) * 0.3;
        ctx!.save();
        ctx!.translate(s * 0.5, -s * 0.2);
        ctx!.rotate(b1Ang);
        ctx!.fillRect(-legW/2, 0, legW, legH);
        ctx!.restore();

        // Back leg 2
        const b2Ang = Math.sin(walkPhase) * 0.3;
        ctx!.save();
        ctx!.translate(s * 0.8, -s * 0.2);
        ctx!.rotate(b2Ang);
        ctx!.fillRect(-legW/2, 0, legW, legH);
        ctx!.restore();

        // Head and trunk
        ctx!.beginPath();
        ctx!.arc(-s * 1.1, -s * 0.7, s * 0.5, 0, Math.PI * 2);
        ctx!.fill();
        
        // Trunk
        const trunkWobble = Math.sin(time * 1.5) * 0.1;
        ctx!.beginPath();
        ctx!.moveTo(-s * 1.4, -s * 0.7);
        ctx!.quadraticCurveTo(-s * 1.8 + trunkWobble * s, -s * 0.2, -s * 1.5, s * 0.4);
        ctx!.lineWidth = s * 0.2;
        ctx!.lineCap = 'round';
        ctx!.strokeStyle = COLORS.mammothBody;
        ctx!.stroke();

        // Tusk
        ctx!.beginPath();
        ctx!.moveTo(-s * 1.2, -s * 0.4);
        ctx!.quadraticCurveTo(-s * 2.2, -s * 0.2, -s * 2.0, -s * 0.8);
        ctx!.lineWidth = s * 0.1;
        ctx!.strokeStyle = COLORS.mammothTusk;
        ctx!.stroke();

        ctx!.restore();
      }
    }

    // ── Draw: Snow Particles ─────────────────────────────────────────
    function drawSnow(time: number) {
      ctx!.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (const s of snowData) {
        s.y += s.speedY * 16.66;
        s.x += (s.speedX + Math.sin(time + s.phase) * 0.0001) * 16.66;
        
        if (s.y > 1) {
          s.y = -0.1;
          s.x = Math.random();
        }
        if (s.x > 1) s.x = 0;
        if (s.x < 0) s.x = 1;

        ctx!.beginPath();
        ctx!.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
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
    function draw(t: number) {
      const time = t * 0.001;
      ctx!.clearRect(0, 0, W, H);

      drawSky();
      drawSun(time);
      drawMountains(MOUNTAINS_FAR, COLORS.mountainFar, H * 0.55);
      drawMountains(MOUNTAINS_NEAR, COLORS.mountainNear, H * 0.60);
      drawGround();
      drawVillage();
      drawMammoths(time);
      drawSnow(time);
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
