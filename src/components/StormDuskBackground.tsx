import { useEffect, useRef } from 'react';

const COLORS = {
  skyTop: '#070b16',
  skyMid: '#101b30',
  skyLow: '#1a2a43',
  skyEdge: '#253a58',
  horizonWarm: 'rgba(247, 166, 102, 0.36)',
  horizonCool: 'rgba(130, 164, 214, 0.24)',
  cloudNear: 'rgba(18, 28, 46, 0.94)',
  cloudMid: 'rgba(28, 41, 63, 0.82)',
  cloudFar: 'rgba(40, 58, 86, 0.66)',
  silhouetteNear: '#05090f',
  silhouetteMid: '#0a121f',
  silhouetteFar: '#111c2f',
  lampWarm: '#ffd69d',
  lampCool: '#c4d9ff',
  vignette: 'rgba(0, 0, 0, 0.58)',
};

type CloudLayer = {
  y: number;
  thickness: number;
  amp: number;
  freqA: number;
  freqB: number;
  speed: number;
  phase: number;
  color: string;
};

type Building = {
  x: number;
  width: number;
  height: number;
  roofStyle: number;
  depth: number;
};

type LightDot = {
  x: number;
  y: number;
  radius: number;
  glow: number;
  alpha: number;
  flicker: number;
  phase: number;
  warm: boolean;
};

type StreetLight = {
  x: number;
  y: number;
  height: number;
  alpha: number;
  flicker: number;
  phase: number;
  warm: boolean;
};

type TrafficCar = {
  lane: number;
  direction: 1 | -1;
  offset: number;
  speed: number;
  length: number;
  phase: number;
};

type Drizzle = {
  x: number;
  y: number;
  len: number;
  speed: number;
  width: number;
  phase: number;
  alpha: number;
};

type Spire = {
  x: number;
  height: number;
  width: number;
  phase: number;
};

type Branch = {
  x: number;
  y: number;
  length: number;
  bend: number;
  dir: 1 | -1;
  phase: number;
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
}

function generateBuildings(seed: number) {
  const rand = seededRandom(seed);
  const items: Building[] = [];
  let cursor = -0.05;

  while (cursor < 1.06) {
    const width = 0.026 + rand() * 0.064;
    const height = 0.05 + rand() * 0.14;
    items.push({
      x: cursor,
      width,
      height,
      roofStyle: Math.floor(rand() * 3),
      depth: 0.3 + rand() * 0.7,
    });
    cursor += width + 0.003 + rand() * 0.012;
  }

  return items;
}

function generateLights(buildings: Building[], seed: number) {
  const rand = seededRandom(seed);
  const dots: LightDot[] = [];

  for (const b of buildings) {
    const count = rand() > 0.6 ? 2 : 1;
    for (let i = 0; i < count; i += 1) {
      const anchorX = b.x + b.width * (0.2 + rand() * 0.6);
      const anchorY = 0.66 - b.height * (0.15 + rand() * 0.2);
      dots.push({
        x: anchorX,
        y: anchorY,
        radius: 1.0 + rand() * 2.2,
        glow: 16 + rand() * 30,
        alpha: 0.24 + rand() * 0.5,
        flicker: 0.6 + rand() * 2.2,
        phase: rand() * Math.PI * 2,
        warm: rand() > 0.25,
      });
    }
  }

  for (let i = 0; i < 18; i += 1) {
    dots.push({
      x: rand(),
      y: 0.72 + rand() * 0.19,
      radius: 1.1 + rand() * 2.8,
      glow: 20 + rand() * 36,
      alpha: 0.22 + rand() * 0.46,
      flicker: 0.4 + rand() * 1.7,
      phase: rand() * Math.PI * 2,
      warm: rand() > 0.4,
    });
  }

  return dots;
}

function generateStreetLights(count: number, seed: number) {
  const rand = seededRandom(seed);
  const lights: StreetLight[] = [];

  for (let i = 0; i < count; i += 1) {
    const lane = i % 3;
    lights.push({
      x: rand() * 1.12 - 0.06,
      y: 0.70 + lane * 0.045 + rand() * 0.045,
      height: 0.03 + rand() * 0.08,
      alpha: 0.26 + rand() * 0.44,
      flicker: 0.9 + rand() * 2.7,
      phase: rand() * Math.PI * 2,
      warm: rand() > 0.28,
    });
  }

  return lights;
}

function generateTraffic(count: number, seed: number) {
  const rand = seededRandom(seed);
  const cars: TrafficCar[] = [];

  for (let i = 0; i < count; i += 1) {
    cars.push({
      lane: i % 2,
      direction: rand() > 0.5 ? 1 : -1,
      offset: rand(),
      speed: 0.018 + rand() * 0.056,
      length: 8 + rand() * 20,
      phase: rand() * Math.PI * 2,
    });
  }

  return cars;
}

function generateDrizzle(count: number, seed: number) {
  const rand = seededRandom(seed);
  const drops: Drizzle[] = [];

  for (let i = 0; i < count; i += 1) {
    drops.push({
      x: rand(),
      y: rand(),
      len: 8 + rand() * 22,
      speed: 0.08 + rand() * 0.22,
      width: 0.5 + rand() * 1.2,
      phase: rand() * Math.PI * 2,
      alpha: 0.18 + rand() * 0.4,
    });
  }

  return drops;
}

function generateSpires(count: number, seed: number) {
  const rand = seededRandom(seed);
  const spires: Spire[] = [];

  for (let i = 0; i < count; i += 1) {
    spires.push({
      x: rand(),
      height: 0.02 + rand() * 0.09,
      width: 0.003 + rand() * 0.009,
      phase: rand() * Math.PI * 2,
    });
  }

  return spires;
}

const CLOUD_LAYERS: CloudLayer[] = [
  { y: 0.08, thickness: 0.23, amp: 0.020, freqA: 7.2, freqB: 12.4, speed: 0.035, phase: 0.3, color: COLORS.cloudNear },
  { y: 0.18, thickness: 0.18, amp: 0.018, freqA: 5.7, freqB: 10.1, speed: 0.045, phase: 1.1, color: COLORS.cloudMid },
  { y: 0.30, thickness: 0.16, amp: 0.015, freqA: 4.8, freqB: 8.7, speed: 0.055, phase: 2.2, color: COLORS.cloudFar },
  { y: 0.44, thickness: 0.12, amp: 0.012, freqA: 4.3, freqB: 7.2, speed: 0.06, phase: 2.8, color: 'rgba(58, 79, 112, 0.30)' },
];

const BUILDINGS = generateBuildings(19);
const LIGHTS = generateLights(BUILDINGS, 41);
const STREET_LIGHTS = generateStreetLights(30, 53);
const TRAFFIC = generateTraffic(34, 67);
const DRIZZLE = generateDrizzle(120, 73);
const SPIRES = generateSpires(90, 123);
const BRANCHES: Branch[] = [
  { x: 0.09, y: 1.03, length: 0.42, bend: 0.12, dir: 1, phase: 0.2 },
  { x: 0.15, y: 1.02, length: 0.34, bend: 0.11, dir: 1, phase: 1.1 },
  { x: 0.23, y: 1.04, length: 0.26, bend: 0.08, dir: 1, phase: 1.8 },
  { x: 0.91, y: 1.03, length: 0.40, bend: 0.13, dir: -1, phase: 0.5 },
  { x: 0.85, y: 1.02, length: 0.31, bend: 0.09, dir: -1, phase: 1.4 },
  { x: 0.78, y: 1.05, length: 0.22, bend: 0.07, dir: -1, phase: 2.4 },
];

export default function StormDuskBackground() {
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
    let grainPattern: CanvasPattern | null = null;
    let scanPattern: CanvasPattern | null = null;

    function buildGrainPattern() {
      const pc = document.createElement('canvas');
      pc.width = 96;
      pc.height = 96;
      const pctx = pc.getContext('2d');
      if (!pctx) return null;
      const rand = seededRandom(907);

      pctx.fillStyle = '#000';
      pctx.fillRect(0, 0, 96, 96);

      for (let i = 0; i < 1100; i += 1) {
        const x = Math.floor(rand() * 96);
        const y = Math.floor(rand() * 96);
        const alpha = 0.06 + rand() * 0.16;
        const shade = rand() > 0.55 ? 255 : 0;
        pctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
        pctx.fillRect(x, y, 1, 1);
      }

      return ctx.createPattern(pc, 'repeat');
    }

    function buildScanPattern() {
      const pc = document.createElement('canvas');
      pc.width = 4;
      pc.height = 4;
      const pctx = pc.getContext('2d');
      if (!pctx) return null;

      pctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
      pctx.fillRect(0, 0, 4, 2);
      pctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      pctx.fillRect(0, 2, 4, 2);

      return ctx.createPattern(pc, 'repeat');
    }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.floor(window.innerWidth * DPR);
      H = Math.floor(window.innerHeight * DPR);
      canvas.width = W;
      canvas.height = H;
      grainPattern = null;
      scanPattern = null;
    }

    function drawSky(time: number) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, COLORS.skyTop);
      grad.addColorStop(0.38, COLORS.skyMid);
      grad.addColorStop(0.68, COLORS.skyLow);
      grad.addColorStop(1, COLORS.skyEdge);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const leftGlow = ctx.createRadialGradient(W * 0.16, H * 0.66, 0, W * 0.16, H * 0.66, H * 0.45);
      leftGlow.addColorStop(0, COLORS.horizonWarm);
      leftGlow.addColorStop(0.38, 'rgba(247, 166, 102, 0.08)');
      leftGlow.addColorStop(1, 'rgba(247, 166, 102, 0)');
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, H * 0.45, W, H * 0.55);

      const coolGlow = ctx.createRadialGradient(W * 0.82, H * 0.54, 0, W * 0.82, H * 0.54, H * 0.52);
      coolGlow.addColorStop(0, COLORS.horizonCool);
      coolGlow.addColorStop(0.34, 'rgba(130, 164, 214, 0.10)');
      coolGlow.addColorStop(1, 'rgba(130, 164, 214, 0)');
      ctx.fillStyle = coolGlow;
      ctx.fillRect(0, H * 0.2, W, H * 0.8);

      const tension = Math.pow(Math.max(0, Math.sin(time * 0.11 + 0.8)), 7) * 0.12;
      if (tension > 0.01) {
        ctx.fillStyle = `rgba(180, 206, 255, ${tension})`;
        ctx.fillRect(0, 0, W, H * 0.78);
      }
    }

    function cloudY(layer: CloudLayer, nx: number, time: number) {
      const waveA = Math.sin(nx * Math.PI * layer.freqA + layer.phase + time * layer.speed) * layer.amp;
      const waveB = Math.sin(nx * Math.PI * layer.freqB + layer.phase * 0.8 - time * layer.speed * 0.62) * layer.amp * 0.46;
      return (layer.y + waveA + waveB) * H;
    }

    function drawCloudDeck(time: number) {
      for (const layer of CLOUD_LAYERS) {
        const step = Math.max(26, Math.floor(W / 42));
        const topShade = ctx.createLinearGradient(0, 0, 0, (layer.y + layer.thickness) * H);
        topShade.addColorStop(0, layer.color);
        topShade.addColorStop(0.7, layer.color);
        topShade.addColorStop(1, 'rgba(16, 27, 43, 0.08)');

        ctx.beginPath();
        for (let x = -step; x <= W + step; x += step) {
          const nx = x / W;
          const y = cloudY(layer, nx, time);
          if (x === -step) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let x = W + step; x >= -step; x -= step) {
          const nx = x / W;
          const lower =
            (layer.y + layer.thickness) * H +
            Math.sin(nx * Math.PI * (layer.freqA * 0.72) + layer.phase * 1.2 + time * layer.speed * 0.38) * layer.amp * H * 0.35 +
            Math.sin(nx * Math.PI * (layer.freqB * 0.46) - layer.phase + time * layer.speed * 0.19) * layer.amp * H * 0.2;
          ctx.lineTo(x, lower);
        }
        ctx.closePath();
        ctx.fillStyle = topShade;
        ctx.fill();
      }

      const stormBand = ctx.createLinearGradient(0, H * 0.5, 0, H * 0.7);
      stormBand.addColorStop(0, 'rgba(148, 175, 222, 0.10)');
      stormBand.addColorStop(1, 'rgba(148, 175, 222, 0)');
      ctx.fillStyle = stormBand;
      ctx.fillRect(0, H * 0.5, W, H * 0.2);
    }

    function drawHorizonLayers(time: number) {
      const pulse = 0.84 + Math.sin(time * 0.22) * 0.16;
      const y = H * 0.6;

      const warmBand = ctx.createLinearGradient(0, y - H * 0.05, 0, y + H * 0.08);
      warmBand.addColorStop(0, 'rgba(249, 170, 114, 0)');
      warmBand.addColorStop(0.46, `rgba(249, 170, 114, ${0.24 * pulse})`);
      warmBand.addColorStop(1, 'rgba(249, 170, 114, 0)');
      ctx.fillStyle = warmBand;
      ctx.fillRect(0, y - H * 0.05, W, H * 0.13);

      const coolBand = ctx.createLinearGradient(0, y - H * 0.04, 0, y + H * 0.11);
      coolBand.addColorStop(0, 'rgba(138, 170, 218, 0)');
      coolBand.addColorStop(0.5, 'rgba(138, 170, 218, 0.16)');
      coolBand.addColorStop(1, 'rgba(138, 170, 218, 0)');
      ctx.fillStyle = coolBand;
      ctx.fillRect(0, y - H * 0.04, W, H * 0.15);
    }

    function drawSilhouettes(time: number) {
      const baseY = H * 0.69;

      ctx.save();
      ctx.globalAlpha = 0.84;
      ctx.fillStyle = COLORS.silhouetteFar;
      for (const s of SPIRES) {
        const x = s.x * W;
        const h = s.height * H * (0.95 + Math.sin(time * 0.08 + s.phase) * 0.06);
        const w = s.width * W;
        ctx.beginPath();
        ctx.moveTo(x - w, baseY + H * 0.01);
        ctx.lineTo(x, baseY - h);
        ctx.lineTo(x + w, baseY + H * 0.01);
        ctx.closePath();
        ctx.fill();
      }

      for (const b of BUILDINGS) {
        const x = b.x * W;
        const w = b.width * W;
        const h = b.height * H;
        const y = baseY - h;
        const shade = b.depth < 0.55 ? COLORS.silhouetteMid : COLORS.silhouetteNear;

        ctx.fillStyle = shade;
        ctx.fillRect(x, y, w, h + H * 0.02);

        if (b.roofStyle === 1) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + w * 0.5, y - h * 0.25);
          ctx.lineTo(x + w, y);
          ctx.closePath();
          ctx.fill();
        } else if (b.roofStyle === 2) {
          ctx.fillRect(x + w * 0.35, y - h * 0.2, w * 0.3, h * 0.2);
        }
      }
      ctx.restore();

      const skylineBlend = ctx.createLinearGradient(0, baseY - H * 0.2, 0, baseY + H * 0.2);
      skylineBlend.addColorStop(0, 'rgba(146, 173, 214, 0)');
      skylineBlend.addColorStop(0.45, 'rgba(146, 173, 214, 0.12)');
      skylineBlend.addColorStop(1, 'rgba(146, 173, 214, 0)');
      ctx.fillStyle = skylineBlend;
      ctx.fillRect(0, baseY - H * 0.2, W, H * 0.4);

      const foreground = ctx.createLinearGradient(0, baseY, 0, H);
      foreground.addColorStop(0, 'rgba(10, 16, 26, 0.12)');
      foreground.addColorStop(0.45, 'rgba(9, 14, 22, 0.46)');
      foreground.addColorStop(1, 'rgba(6, 10, 16, 0.68)');
      ctx.fillStyle = foreground;
      ctx.fillRect(0, baseY - H * 0.02, W, H - baseY + H * 0.02);

      const groundMist = ctx.createLinearGradient(0, baseY + H * 0.02, 0, H);
      groundMist.addColorStop(0, 'rgba(156, 182, 224, 0.20)');
      groundMist.addColorStop(0.35, 'rgba(108, 133, 168, 0.12)');
      groundMist.addColorStop(1, 'rgba(16, 24, 36, 0)');
      ctx.fillStyle = groundMist;
      ctx.fillRect(0, baseY + H * 0.02, W, H - (baseY + H * 0.02));

      return baseY;
    }

    function drawStreetLights(time: number, baseY: number) {
      ctx.save();
      ctx.lineCap = 'round';

      for (const lamp of STREET_LIGHTS) {
        const x = lamp.x * W;
        const y = lamp.y * H;
        const topY = y - lamp.height * H;
        if (x < -40 * DPR || x > W + 40 * DPR) continue;

        const dropout = Math.pow(Math.max(0, Math.sin(time * 0.95 + lamp.phase * 1.7)), 9);
        const flicker = 0.66 + 0.34 * Math.sin(time * lamp.flicker + lamp.phase);
        const alpha = lamp.alpha * Math.max(0.06, flicker - dropout * 0.58);
        const isWarm = lamp.warm;

        ctx.strokeStyle = `rgba(24, 33, 46, ${0.66 - alpha * 0.3})`;
        ctx.lineWidth = Math.max(1, 1.35 * DPR);
        ctx.beginPath();
        ctx.moveTo(x, y + 2 * DPR);
        ctx.lineTo(x, topY);
        ctx.stroke();

        ctx.fillStyle = `rgba(${isWarm ? '255, 214, 157' : '198, 223, 255'}, ${Math.min(0.92, alpha + 0.2)})`;
        ctx.beginPath();
        ctx.arc(x, topY, 1.8 * DPR, 0, Math.PI * 2);
        ctx.fill();

        const glowSize = (22 + lamp.height * H * 0.24) * DPR;
        const glow = ctx.createRadialGradient(x, topY, 0, x, topY, glowSize);
        glow.addColorStop(0, `rgba(${isWarm ? '255, 216, 152' : '182, 213, 255'}, ${alpha * 0.95})`);
        glow.addColorStop(0.5, `rgba(${isWarm ? '255, 198, 132' : '168, 198, 236'}, ${alpha * 0.34})`);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - glowSize, topY - glowSize, glowSize * 2, glowSize * 2);

        const reflectLen = Math.max(9 * DPR, (y - baseY) * 0.55);
        const reflection = ctx.createLinearGradient(x, y, x, y + reflectLen);
        reflection.addColorStop(0, `rgba(${isWarm ? '255, 208, 138' : '180, 206, 244'}, ${alpha * 0.3})`);
        reflection.addColorStop(1, 'rgba(100, 124, 158, 0)');
        ctx.strokeStyle = reflection;
        ctx.lineWidth = Math.max(1, 1.05 * DPR);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.sin(time * 0.8 + lamp.phase) * 4 * DPR, y + reflectLen);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawTraffic(time: number, baseY: number) {
      const laneA = baseY + H * 0.045;
      const laneB = baseY + H * 0.085;

      const laneGlow = ctx.createLinearGradient(0, laneA - 8 * DPR, 0, laneB + 14 * DPR);
      laneGlow.addColorStop(0, 'rgba(126, 150, 189, 0)');
      laneGlow.addColorStop(0.5, 'rgba(126, 150, 189, 0.08)');
      laneGlow.addColorStop(1, 'rgba(126, 150, 189, 0)');
      ctx.fillStyle = laneGlow;
      ctx.fillRect(0, laneA - 8 * DPR, W, laneB - laneA + 22 * DPR);

      ctx.save();
      ctx.lineCap = 'round';
      for (const car of TRAFFIC) {
        const progress = ((car.offset + time * car.speed) % 1 + 1) % 1;
        const x = (car.direction === 1 ? progress : 1 - progress) * (W * 1.24) - W * 0.12;
        const yBase = car.lane === 0 ? laneA : laneB;
        const y = yBase + Math.sin(time * 0.75 + car.phase) * H * 0.0026;
        const len = car.length * DPR;

        if (x < -50 * DPR || x > W + 50 * DPR) continue;

        const headX = x + car.direction * len * 0.45;
        const tailX = x - car.direction * len * 0.45;
        const headAlpha = 0.28 + Math.sin(time * 2.1 + car.phase) * 0.14;
        const tailAlpha = 0.22 + Math.sin(time * 1.6 + car.phase + 1.4) * 0.1;

        const headGrad = ctx.createLinearGradient(
          headX - car.direction * len * 2.1,
          y,
          headX,
          y,
        );
        headGrad.addColorStop(0, 'rgba(255, 236, 206, 0)');
        headGrad.addColorStop(1, `rgba(255, 236, 206, ${Math.max(0.05, headAlpha)})`);
        ctx.strokeStyle = headGrad;
        ctx.lineWidth = Math.max(1.1, 1.8 * DPR);
        ctx.beginPath();
        ctx.moveTo(headX - car.direction * len * 2.1, y);
        ctx.lineTo(headX, y);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 236, 206, ${Math.max(0.12, headAlpha + 0.2)})`;
        ctx.beginPath();
        ctx.arc(headX, y, 1.25 * DPR, 0, Math.PI * 2);
        ctx.fill();

        const tailGrad = ctx.createLinearGradient(
          tailX + car.direction * len * 1.8,
          y + 0.5 * DPR,
          tailX,
          y + 0.5 * DPR,
        );
        tailGrad.addColorStop(0, 'rgba(255, 124, 102, 0)');
        tailGrad.addColorStop(1, `rgba(255, 124, 102, ${Math.max(0.05, tailAlpha)})`);
        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = Math.max(1.0, 1.5 * DPR);
        ctx.beginPath();
        ctx.moveTo(tailX + car.direction * len * 1.8, y + 0.5 * DPR);
        ctx.lineTo(tailX, y + 0.5 * DPR);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 126, 103, ${Math.max(0.08, tailAlpha + 0.18)})`;
        ctx.beginPath();
        ctx.arc(tailX, y + 0.5 * DPR, 1.0 * DPR, 0, Math.PI * 2);
        ctx.fill();

        const wetReflect = ctx.createLinearGradient(x, y + 2 * DPR, x, y + 13 * DPR);
        wetReflect.addColorStop(0, `rgba(170, 190, 224, ${0.08 + headAlpha * 0.18})`);
        wetReflect.addColorStop(1, 'rgba(170, 190, 224, 0)');
        ctx.strokeStyle = wetReflect;
        ctx.lineWidth = Math.max(0.8, 1.2 * DPR);
        ctx.beginPath();
        ctx.moveTo(x, y + 2 * DPR);
        ctx.lineTo(x + car.direction * len * 0.18, y + 13 * DPR);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawLights(time: number) {
      for (const light of LIGHTS) {
        const x = light.x * W;
        const y = light.y * H;
        const alpha = light.alpha * (0.72 + 0.28 * Math.sin(time * light.flicker + light.phase));
        const color = light.warm ? COLORS.lampWarm : COLORS.lampCool;

        const glow = ctx.createRadialGradient(x, y, 0, x, y, light.glow * DPR);
        glow.addColorStop(0, `${color}${Math.round(Math.min(1, alpha) * 255).toString(16).padStart(2, '0')}`);
        glow.addColorStop(0.4, `${color}44`);
        glow.addColorStop(1, `${color}00`);
        ctx.fillStyle = glow;
        ctx.fillRect(x - light.glow * DPR, y - light.glow * DPR, light.glow * DPR * 2, light.glow * DPR * 2);

        ctx.fillStyle = `rgba(${light.warm ? '255, 214, 157' : '196, 217, 255'}, ${Math.min(1, alpha + 0.3)})`;
        ctx.beginPath();
        ctx.arc(x, y, light.radius * DPR, 0, Math.PI * 2);
        ctx.fill();

        const reflectionLen = (16 + light.glow * 0.45) * DPR;
        const reflection = ctx.createLinearGradient(x, y + 2 * DPR, x, y + reflectionLen);
        reflection.addColorStop(0, `rgba(${light.warm ? '255, 206, 136' : '190, 214, 255'}, ${alpha * 0.36})`);
        reflection.addColorStop(1, 'rgba(120, 138, 168, 0)');
        ctx.strokeStyle = reflection;
        ctx.lineWidth = Math.max(1, light.radius * 0.72 * DPR);
        ctx.beginPath();
        ctx.moveTo(x, y + 2 * DPR);
        ctx.lineTo(x + Math.sin(time * 0.5 + light.phase) * 4 * DPR, y + reflectionLen);
        ctx.stroke();
      }
    }

    function drawDrizzle(time: number) {
      ctx.save();
      ctx.lineCap = 'round';

      for (const d of DRIZZLE) {
        const x = ((((d.x + Math.sin(time * 0.1 + d.phase) * 0.014) % 1) + 1) % 1) * W;
        const y = ((((d.y + time * d.speed) % 1) + 1) % 1) * H;
        if (y < H * 0.07 || y > H * 0.95) continue;

        const len = d.len * DPR * (0.7 + H / 1800);
        const alpha = d.alpha * (0.66 + 0.34 * Math.sin(time * 1.8 + d.phase));
        ctx.strokeStyle = `rgba(168, 190, 224, ${alpha})`;
        ctx.lineWidth = d.width * DPR;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - len * 0.32, y + len);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawForegroundBranches(time: number) {
      ctx.save();
      ctx.strokeStyle = 'rgba(16, 22, 30, 0.62)';
      ctx.lineCap = 'round';

      for (const b of BRANCHES) {
        const baseX = b.x * W;
        const baseY = b.y * H;
        const sway = Math.sin(time * 0.24 + b.phase) * W * 0.0025;
        const tipX = baseX + b.dir * b.length * W * 0.26 + sway;
        const tipY = baseY - b.length * H;

        ctx.lineWidth = Math.max(1.2, 2.4 * DPR);
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(
          baseX + b.dir * b.bend * W * 0.5 + sway * 0.6,
          baseY - b.length * H * 0.58,
          tipX,
          tipY,
        );
        ctx.stroke();

        for (let t = 0.2; t < 0.92; t += 0.18) {
          const px = baseX + (tipX - baseX) * t;
          const py = baseY + (tipY - baseY) * t;
          const twigDir = t % 0.36 < 0.18 ? 1 : -1;
          const tx = px + b.dir * twigDir * W * (0.018 + t * 0.03);
          const ty = py - H * (0.018 + t * 0.012);
          ctx.lineWidth = Math.max(1, 1.4 * DPR);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    function drawPost() {
      if (!grainPattern) grainPattern = buildGrainPattern();
      if (!scanPattern) scanPattern = buildScanPattern();

      if (grainPattern) {
        ctx.save();
        ctx.globalAlpha = 0.085;
        ctx.fillStyle = grainPattern;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      if (scanPattern) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = scanPattern;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      const vignette = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.12, W * 0.5, H * 0.52, H * 0.82);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.66, 'rgba(0, 0, 0, 0.22)');
      vignette.addColorStop(1, COLORS.vignette);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);
    }

    function frame(timestamp: number) {
      const time = timestamp * 0.001;
      ctx.clearRect(0, 0, W, H);
      drawSky(time);
      drawCloudDeck(time);
      drawHorizonLayers(time);
      const skylineBase = drawSilhouettes(time);
      drawStreetLights(time, skylineBase);
      drawTraffic(time, skylineBase);
      drawLights(time);
      drawDrizzle(time);
      drawForegroundBranches(time);
      drawPost();
      rafRef.current = window.requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    rafRef.current = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
      }}
      aria-hidden="true"
    />
  );
}
