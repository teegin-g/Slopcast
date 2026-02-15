import { useEffect, useRef } from 'react';

const COLORS = {
  skyTop: '#8fd6ff',
  skyMid: '#7fc6ff',
  skyLow: '#68afe9',
  sunCore: 'rgba(255, 241, 182, 0.50)',
  sunGlow: 'rgba(255, 220, 120, 0.18)',
  cloud: 'rgba(248, 254, 255, 0.24)',
  cloudEdge: 'rgba(255, 255, 255, 0.18)',
  haze: 'rgba(255, 233, 167, 0.12)',
  hillFar: '#4a9b62',
  hillMid: '#3f8354',
  hillNear: '#2f6643',
  hillLineFar: 'rgba(214, 249, 199, 0.26)',
  hillLineMid: 'rgba(208, 241, 192, 0.22)',
  hillLineNear: 'rgba(178, 218, 162, 0.20)',
  motifPipe: 'rgba(105, 195, 108, 0.20)',
  motifPipeCap: 'rgba(156, 228, 145, 0.23)',
  motifBlock: 'rgba(233, 190, 68, 0.18)',
  motifCoin: 'rgba(252, 229, 130, 0.22)',
  motifInk: 'rgba(114, 72, 22, 0.18)',
  vignette: 'rgba(10, 20, 36, 0.50)',
};

type Cloud = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  phase: number;
};

type Motif = {
  kind: 'pipe' | 'block' | 'coin';
  x: number;
  y: number;
  scale: number;
  depth: number;
  phase: number;
};

type Sparkle = {
  x: number;
  y: number;
  size: number;
  twinkle: number;
  drift: number;
  alpha: number;
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
}

function generateClouds(count: number) {
  const rand = seededRandom(84);
  const clouds: Cloud[] = [];
  for (let i = 0; i < count; i += 1) {
    clouds.push({
      x: rand() * 1.4 - 0.2,
      y: 0.09 + rand() * 0.24,
      width: 0.12 + rand() * 0.18,
      height: 0.028 + rand() * 0.028,
      speed: 0.000012 + rand() * 0.000022,
      phase: rand() * Math.PI * 2,
    });
  }
  return clouds;
}

function generateMotifs(count: number) {
  const rand = seededRandom(1337);
  const motifs: Motif[] = [];
  for (let i = 0; i < count; i += 1) {
    const roll = rand();
    const kind: Motif['kind'] = roll < 0.42 ? 'pipe' : roll < 0.77 ? 'block' : 'coin';
    const lane = i % 3;
    motifs.push({
      kind,
      x: rand() * 1.08 - 0.04,
      y: 0.56 + lane * 0.12 + rand() * 0.16,
      scale: 0.62 + rand() * 0.85,
      depth: 0.72 + lane * 0.13,
      phase: rand() * Math.PI * 2,
    });
  }
  return motifs;
}

function generateSparkles(count: number) {
  const rand = seededRandom(451);
  const sparkles: Sparkle[] = [];
  for (let i = 0; i < count; i += 1) {
    sparkles.push({
      x: rand(),
      y: 0.46 + rand() * 0.26,
      size: 0.7 + rand() * 2.1,
      twinkle: rand() * Math.PI * 2,
      drift: 0.20 + rand() * 0.45,
      alpha: 0.32 + rand() * 0.50,
    });
  }
  return sparkles;
}

const CLOUDS = generateClouds(9);
const MOTIFS = generateMotifs(24);
const SPARKLES = generateSparkles(42);

type HillLayer = {
  baseY: number;
  amp: number;
  freqA: number;
  freqB: number;
  phase: number;
  speed: number;
  fill: string;
  line: string;
};

const HILL_LAYERS: HillLayer[] = [
  {
    baseY: 0.55,
    amp: 0.03,
    freqA: 1.8,
    freqB: 4.8,
    phase: 0.5,
    speed: 0.12,
    fill: COLORS.hillFar,
    line: COLORS.hillLineFar,
  },
  {
    baseY: 0.64,
    amp: 0.036,
    freqA: 2.1,
    freqB: 5.5,
    phase: 1.8,
    speed: 0.16,
    fill: COLORS.hillMid,
    line: COLORS.hillLineMid,
  },
  {
    baseY: 0.73,
    amp: 0.042,
    freqA: 2.4,
    freqB: 6.2,
    phase: 2.6,
    speed: 0.22,
    fill: COLORS.hillNear,
    line: COLORS.hillLineNear,
  },
];

export default function MarioOverworldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let DPR = 1;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.floor(window.innerWidth * DPR);
      H = Math.floor(window.innerHeight * DPR);
      canvas.width = W;
      canvas.height = H;
    }

    function ridgeY(nx: number, time: number, layer: HillLayer) {
      const waveA = Math.sin(nx * Math.PI * layer.freqA + layer.phase + time * layer.speed) * layer.amp;
      const waveB = Math.sin(nx * Math.PI * layer.freqB + layer.phase * 0.7 - time * layer.speed * 0.5) * layer.amp * 0.46;
      return (layer.baseY + waveA + waveB) * H;
    }

    function drawSky(time: number) {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, COLORS.skyTop);
      sky.addColorStop(0.44, COLORS.skyMid);
      sky.addColorStop(1, COLORS.skyLow);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      const sunX = W * 0.8;
      const sunY = H * 0.18;
      const sunPulse = 1 + Math.sin(time * 0.7) * 0.04;
      const sunRadius = Math.min(W, H) * 0.12 * sunPulse;
      const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
      sun.addColorStop(0, COLORS.sunCore);
      sun.addColorStop(0.45, COLORS.sunGlow);
      sun.addColorStop(1, 'rgba(255, 220, 120, 0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, W, H * 0.62);

      const haze = ctx.createLinearGradient(0, H * 0.42, 0, H * 0.72);
      haze.addColorStop(0, 'rgba(255, 233, 167, 0)');
      haze.addColorStop(0.52, COLORS.haze);
      haze.addColorStop(1, 'rgba(255, 233, 167, 0)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, H * 0.42, W, H * 0.3);
    }

    function drawClouds(time: number) {
      for (let i = 0; i < CLOUDS.length; i += 1) {
        const c = CLOUDS[i];
        const x = (((c.x + time * c.speed) % 1.5) - 0.25) * W;
        const y = (c.y + Math.sin(time * 0.22 + c.phase) * 0.006) * H;
        const w = c.width * W;
        const h = c.height * H;

        const g = ctx.createRadialGradient(x, y, w * 0.05, x, y, w * 0.75);
        g.addColorStop(0, COLORS.cloud);
        g.addColorStop(0.65, COLORS.cloudEdge);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;

        ctx.beginPath();
        ctx.ellipse(x, y, w * 0.54, h, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - w * 0.24, y + h * 0.1, w * 0.26, h * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + w * 0.24, y + h * 0.06, w * 0.28, h * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawHills(time: number) {
      for (let i = 0; i < HILL_LAYERS.length; i += 1) {
        const layer = HILL_LAYERS[i];
        const segment = W / 34;

        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, ridgeY(0, time, layer));
        for (let x = segment; x <= W + segment; x += segment) {
          const nx = x / W;
          ctx.lineTo(x, ridgeY(nx, time, layer));
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = layer.fill;
        ctx.globalAlpha = 0.46 + i * 0.18;
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.strokeStyle = layer.line;
        ctx.lineWidth = (1.6 + i * 0.6) * DPR;
        ctx.beginPath();
        for (let x = 0; x <= W; x += segment) {
          const nx = x / W;
          const y = ridgeY(nx, time, layer) + 1.5 * DPR;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    function drawMotifs(time: number) {
      const unit = Math.min(W, H) / 720;
      for (let i = 0; i < MOTIFS.length; i += 1) {
        const m = MOTIFS[i];
        const x = m.x * W;
        const y = m.y * H + Math.sin(time * 0.7 + m.phase) * (1.2 + m.depth);
        const s = m.scale * unit * 1.3;

        ctx.globalAlpha = 0.55 * m.depth;
        if (m.kind === 'pipe') {
          const bodyW = 22 * s;
          const bodyH = 64 * s;
          const capH = 12 * s;
          ctx.fillStyle = COLORS.motifPipe;
          ctx.fillRect(x - bodyW / 2, y - bodyH, bodyW, bodyH);
          ctx.fillStyle = COLORS.motifPipeCap;
          ctx.fillRect(x - bodyW * 0.72, y - bodyH - capH, bodyW * 1.44, capH);
        } else if (m.kind === 'block') {
          const size = 20 * s;
          ctx.fillStyle = COLORS.motifBlock;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
          ctx.strokeStyle = COLORS.motifInk;
          ctx.lineWidth = Math.max(1, 1.1 * DPR);
          ctx.strokeRect(x - size / 2, y - size / 2, size, size);
          ctx.fillStyle = 'rgba(255, 232, 154, 0.2)';
          ctx.fillRect(x - size * 0.15, y - size * 0.15, size * 0.3, size * 0.3);
        } else {
          const rx = 10 * s;
          const ry = 7 * s;
          ctx.fillStyle = COLORS.motifCoin;
          ctx.beginPath();
          ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 248, 214, 0.36)';
          ctx.beginPath();
          ctx.ellipse(x - rx * 0.2, y - ry * 0.1, rx * 0.25, ry * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    function drawSparkles(time: number) {
      for (let i = 0; i < SPARKLES.length; i += 1) {
        const p = SPARKLES[i];
        const x = (p.x + Math.sin(time * 0.11 + p.twinkle) * 0.004) * W;
        const y = (p.y + Math.sin(time * p.drift + p.twinkle) * 0.01) * H;
        const alpha = Math.max(0, Math.min(1, (0.22 + 0.24 * (Math.sin(time * 1.4 + p.twinkle) * 0.5 + 0.5)) * p.alpha));

        ctx.fillStyle = `rgba(255, 246, 190, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size * DPR * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawVignette() {
      const vg = ctx.createRadialGradient(W * 0.5, H * 0.38, W * 0.18, W * 0.5, H * 0.52, W * 0.85);
      vg.addColorStop(0, 'rgba(8, 16, 28, 0)');
      vg.addColorStop(0.55, 'rgba(10, 20, 36, 0.18)');
      vg.addColorStop(0.84, 'rgba(10, 20, 36, 0.34)');
      vg.addColorStop(1, COLORS.vignette);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }

    function draw(frameTime: number) {
      const time = frameTime * 0.001;
      ctx.clearRect(0, 0, W, H);
      drawSky(time);
      drawClouds(time);
      drawHills(time);
      drawMotifs(time);
      drawSparkles(time);
      drawVignette();
      rafRef.current = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="mario-overworld-bg-wrap"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
