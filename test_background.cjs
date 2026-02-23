const { createCanvas } = require('canvas');

const W = 1920;
const H = 1080;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

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
  auroraGreen: 'rgba(45, 212, 191, ',
  auroraPurple: 'rgba(192, 132, 252, ',
  pineDark: '#0f1b29',
  pineLight: '#1e334a',
  pineSnow: '#cbd5e1',
  fireGlow: '#f97316',
  fireCore: '#fde047',
};

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function generateSnow(count) {
  const rand = seededRandom(101);
  const snow = [];
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

function generateIceSparkles(count) {
  const rand = seededRandom(202);
  const sparkles = [];
  for (let i = 0; i < count; i++) {
    sparkles.push({
      x: rand(),
      y: 0.85 + rand() * 0.15,
      phase: rand() * Math.PI * 2,
      speed: 1 + rand() * 2,
      size: 0.5 + rand() * 1.5,
    });
  }
  return sparkles;
}

function generateTrees() {
  const rand = seededRandom(303);
  const trees = [];
  for(let i=0; i<6; i++) {
    trees.push({
      x: -0.05 + rand() * 0.15,
      y: 0.8 + rand() * 0.2,
      scale: 0.5 + rand() * 0.8,
      swayPhase: rand() * Math.PI * 2
    });
  }
  for(let i=0; i<6; i++) {
    trees.push({
      x: 0.85 + rand() * 0.15,
      y: 0.8 + rand() * 0.2,
      scale: 0.5 + rand() * 0.8,
      swayPhase: rand() * Math.PI * 2
    });
  }
  for(let i=0; i<8; i++) {
    trees.push({
      x: 0.1 + rand() * 0.8,
      y: 0.6 + rand() * 0.1,
      scale: 0.15 + rand() * 0.15,
      swayPhase: rand() * Math.PI * 2
    });
  }
  return trees.sort((a,b) => a.y - b.y);
}

function generateMountains(seed, points, amp) {
  const rand = seededRandom(seed);
  const peaks = [];
  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    const distFromCenter = Math.abs(progress - 0.5);
    const envelope = Math.min(1, distFromCenter / 0.35);
    const smoothEnvelope = envelope * envelope * (3 - 2 * envelope);
    const baseHeight = smoothEnvelope * amp * 0.8;
    const randomPeak = rand() * amp * 0.5 * (0.2 + 0.8 * smoothEnvelope);
    peaks.push(baseHeight + randomPeak);
  }
  return peaks;
}

function generateMammoths() {
  const rand = seededRandom(404);
  const mams = [];
  for (let i = 0; i < 3; i++) {
    mams.push({
      baseX: rand() * 1.2 - 0.1,
      baseY: 0.65 + rand() * 0.1,
      size: 0.02 + rand() * 0.015,
      speed: (0.000004 + rand() * 0.000003) * (rand() > 0.5 ? 1 : -1),
      legPhaseOff: rand() * Math.PI * 2,
      direction: 1,
    });
  }
  return mams;
}

const SNOW = generateSnow(200);
const MOUNTAINS_FAR = generateMountains(77, 10, 0.45);
const MOUNTAINS_NEAR = generateMountains(88, 8, 0.3);
const MAMMOTHS = generateMammoths();
const ICE_SPARKLES = generateIceSparkles(80);
const TREES = generateTrees();

const snowData = SNOW.map(s => ({ ...s }));
const mammothsData = MAMMOTHS.map(m => ({ ...m, direction: m.speed > 0 ? 1 : -1 }));

const sunImgRef = { current: { width: 100, height: 100 } }; // Mock image

try {
  let time = 1.0;
  function drawSky(time) {
      const grad = ctx.createLinearGradient(0, 0, 0, H * 0.6);
      grad.addColorStop(0, COLORS.skyTop);
      grad.addColorStop(0.5, COLORS.skyMid);
      grad.addColorStop(0.85, COLORS.skyLow);
      grad.addColorStop(1, COLORS.horizon);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H * 0.6);

      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 3; i++) {
        const isGreen = i % 2 === 0;
        const colorPrefix = isGreen ? COLORS.auroraGreen : COLORS.auroraPurple;
        
        ctx.beginPath();
        const startY = H * (0.1 + i * 0.1);
        ctx.moveTo(0, startY);
        
        for (let x = 0; x <= W; x += W / 20) {
          const wave = Math.sin(time * 0.5 + x * 0.002 + i) * (H * 0.1) + Math.cos(time * 0.3 + x * 0.005) * (H * 0.05);
          ctx.lineTo(x, startY + wave);
        }
        
        ctx.lineTo(W, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();

        const auroraGrad = ctx.createLinearGradient(0, 0, 0, H * 0.4);
        const alpha = 0.1 + Math.sin(time * 0.4 + i * 2) * 0.05;
        auroraGrad.addColorStop(0, `${colorPrefix}${alpha})`);
        auroraGrad.addColorStop(1, `${colorPrefix}0)`);
        
        ctx.fillStyle = auroraGrad;
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function drawSun(time) {
      if (!sunImgRef.current) return;
      const cx = W * 0.5;
      const cy = H * 0.35;
      const size = Math.min(W, H) * 0.55;
      
      const glowGrad = ctx.createRadialGradient(cx, cy, size * 0.1, cx, cy, size * 1.2);
      glowGrad.addColorStop(0, 'rgba(255, 235, 150, 0.6)');
      glowGrad.addColorStop(0.2, 'rgba(251, 188, 5, 0.3)');
      glowGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.1)');
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      const numBeams = 12;
      for (let i = 0; i < numBeams; i++) {
        const angle = (i / numBeams) * Math.PI * 2 + time * 0.05 * (i % 2 === 0 ? 1 : -1);
        const beamAlpha = 0.05 + Math.sin(time * 0.5 + i) * 0.05;
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size * 0.1, size * 1.5);
        ctx.lineTo(-size * 0.1, size * 1.5);
        ctx.closePath();
        const beamGrad = ctx.createLinearGradient(0, 0, 0, size * 1.5);
        beamGrad.addColorStop(0, `rgba(251, 188, 5, ${beamAlpha * 1.5})`);
        beamGrad.addColorStop(1, 'rgba(251, 188, 5, 0)');
        ctx.fillStyle = beamGrad;
        ctx.fill();
        ctx.rotate(-angle);
      }
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.2); 
      // Mock drawImage
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    }

    function drawMountains(peaks, color, baseH) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, H);
      const step = W / (peaks.length - 1);
      for (let i = 0; i < peaks.length; i++) {
        const x = i * step;
        const y = baseH - peaks[i] * H;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    }

    function drawGround(time) {
      const startY = H * 0.55;
      
      const grad = ctx.createLinearGradient(0, startY, 0, H);
      grad.addColorStop(0, COLORS.snowDark);
      grad.addColorStop(1, COLORS.snowGround);
      ctx.fillStyle = grad;
      ctx.fillRect(0, startY, W, H - startY);

      for (let i = 0; i < 3; i++) {
        const driftY = H * (0.8 + i * 0.08);
        const driftH = H * 0.08;
        const phaseOff = i * Math.PI / 2;
        
        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, driftY);
        
        for (let x = 0; x <= W; x += W / 30) {
          const wave = Math.sin(time * 0.2 + x * 0.0015 + phaseOff) * driftH;
          ctx.lineTo(x, driftY + wave);
        }
        
        ctx.lineTo(W, H);
        ctx.closePath();

        const driftGrad = ctx.createLinearGradient(0, driftY - driftH, 0, H);
        driftGrad.addColorStop(0, `rgba(226, 232, 240, ${0.4 + i * 0.2})`); 
        driftGrad.addColorStop(1, COLORS.snowGround);
        
        ctx.fillStyle = driftGrad;
        ctx.fill();
      }

      for (const s of ICE_SPARKLES) {
        const alpha = 0.2 + Math.sin(time * s.speed + s.phase) * 0.8;
        if (alpha <= 0) continue;
        
        const x = s.x * W;
        const y = s.y * H;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, s.size, 0, Math.PI * 2);
        ctx.fill();
        
        if (alpha > 0.8) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x - s.size * 2, y);
          ctx.lineTo(x + s.size * 2, y);
          ctx.moveTo(x, y - s.size * 2);
          ctx.lineTo(x, y + s.size * 2);
          ctx.stroke();
        }
      }
    }

    function drawRoad(time) {
      const startY = H * 0.58;
      const endY = H;
      const roadTopW = W * 0.15;
      const roadBotW = W * 0.6;
      
      ctx.fillStyle = 'rgba(74, 91, 117, 0.4)'; 
      ctx.beginPath();
      ctx.moveTo(W * 0.5 - roadTopW / 2, startY);
      ctx.lineTo(W * 0.5 + roadTopW / 2, startY);
      ctx.lineTo(W * 0.5 + roadBotW / 2, endY);
      ctx.lineTo(W * 0.5 - roadBotW / 2, endY);
      ctx.closePath();
      ctx.fill();

      const numLanterns = 5;
      for (let i = 0; i < numLanterns; i++) {
        const progress = (i + 1) / (numLanterns + 1); 
        
        const ly = startY + Math.pow(progress, 1.5) * (endY - startY);
        const lTopW = roadTopW + Math.pow(progress, 1.5) * (roadBotW - roadTopW);
        const lxLeft = W * 0.5 - lTopW / 2 - W * 0.02 * (1 - progress);
        const lxRight = W * 0.5 + lTopW / 2 + W * 0.02 * (1 - progress);
        const size = H * 0.01 + progress * H * 0.03;

        const flicker = 0.8 + Math.sin(time * 8 + i * 3) * 0.1 + Math.cos(time * 12 + i * 7) * 0.1;
        const alpha = 0.5 * flicker;
        
        ctx.save();
        ctx.translate(lxLeft, ly - size);
        ctx.beginPath();
        const leftGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 4);
        leftGlow.addColorStop(0, `rgba(249, 115, 22, ${alpha})`);
        leftGlow.addColorStop(0.3, `rgba(253, 224, 71, ${alpha * 0.4})`);
        leftGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = leftGlow;
        ctx.arc(0, 0, size * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.fireCore;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3 * flicker, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-size*0.1, size*0.3, size*0.2, size*2);
        ctx.restore();

        ctx.save();
        ctx.translate(lxRight, ly - size * 0.8);
        ctx.beginPath();
        const rightGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 4);
        rightGlow.addColorStop(0, `rgba(249, 115, 22, ${alpha})`);
        rightGlow.addColorStop(0.3, `rgba(253, 224, 71, ${alpha * 0.4})`);
        rightGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rightGlow;
        ctx.arc(0, 0, size * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.fireCore;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3 * flicker, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-size*0.1, size*0.3, size*0.2, size*2);
        ctx.restore();
      }
    }

    function drawVillage() {
      const baseY = H * 0.58;
      ctx.fillStyle = COLORS.villageSil;
      
      const houses = [
        { x: 0.10, w: 0.05, h: 0.04, roofH: 0.03, windows: 2 },
        { x: 0.18, w: 0.06, h: 0.05, roofH: 0.04, windows: 3 },
        { x: 0.28, w: 0.04, h: 0.03, roofH: 0.02, windows: 1 },
        { x: 0.35, w: 0.05, h: 0.04, roofH: 0.03, windows: 2 },
        { x: 0.60, w: 0.07, h: 0.06, roofH: 0.04, windows: 3 },
        { x: 0.70, w: 0.05, h: 0.04, roofH: 0.03, windows: 2 },
        { x: 0.78, w: 0.04, h: 0.03, roofH: 0.02, windows: 1 },
        { x: 0.85, w: 0.06, h: 0.05, roofH: 0.04, windows: 2 },
      ];

      for (const h of houses) {
        const hx = h.x * W;
        const hw = h.w * W;
        const hh = h.h * H;
        const hr = h.roofH * H;

        ctx.beginPath();
        ctx.moveTo(hx, baseY);
        ctx.lineTo(hx, baseY - hh);
        ctx.lineTo(hx + hw, baseY - hh);
        ctx.lineTo(hx + hw, baseY);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(hx - hw * 0.1, baseY - hh);
        ctx.lineTo(hx + hw * 0.5, baseY - hh - hr);
        ctx.lineTo(hx + hw * 1.1, baseY - hh);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = COLORS.windowGlow;
        const winW = hw * 0.15;
        const winH = hh * 0.3;
        for (let i = 0; i < h.windows; i++) {
          const spacing = hw / (h.windows + 1);
          const wx = hx + spacing * (i + 1) - winW / 2;
          const wy = baseY - hh * 0.6;
          
          ctx.shadowColor = COLORS.windowGlow;
          ctx.shadowBlur = 10;
          ctx.fillRect(wx, wy, winW, winH);
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = COLORS.villageSil;
      }
    }

    function drawMammoths(time) {
      for (const m of mammothsData) {
        m.baseX += m.speed * (16.66); 
        if (m.baseX > 1.2) m.baseX = -0.2;
        if (m.baseX < -0.2) m.baseX = 1.2;

        const x = m.baseX * W;
        const y = m.baseY * H;
        const s = m.size * W; 
        const walkPhase = time * 1.2 + m.legPhaseOff;
        
        ctx.save();
        ctx.translate(x, y);
        if (m.direction === -1) {
          ctx.scale(-1, 1);
        }

        ctx.fillStyle = COLORS.mammothBody;
        
        ctx.beginPath();
        ctx.ellipse(0, -s, s, s * 0.7, 0, Math.PI, 0); 
        ctx.lineTo(s, 0); 
        ctx.lineTo(-s * 1.2, 0); 
        ctx.closePath();
        ctx.fill();

        const legW = s * 0.3;
        const legH = s * 0.8;
        
        const f1Ang = Math.sin(walkPhase) * 0.3;
        ctx.save();
        ctx.translate(-s * 0.8, -s * 0.2);
        ctx.rotate(f1Ang);
        ctx.fillRect(-legW/2, 0, legW, legH);
        ctx.restore();
        
        const f2Ang = Math.sin(walkPhase + Math.PI) * 0.3;
        ctx.save();
        ctx.translate(-s * 0.5, -s * 0.2);
        ctx.rotate(f2Ang);
        ctx.fillRect(-legW/2, 0, legW, legH);
        ctx.restore();

        const b1Ang = Math.sin(walkPhase + Math.PI) * 0.3;
        ctx.save();
        ctx.translate(s * 0.5, -s * 0.2);
        ctx.rotate(b1Ang);
        ctx.fillRect(-legW/2, 0, legW, legH);
        ctx.restore();

        const b2Ang = Math.sin(walkPhase) * 0.3;
        ctx.save();
        ctx.translate(s * 0.8, -s * 0.2);
        ctx.rotate(b2Ang);
        ctx.fillRect(-legW/2, 0, legW, legH);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(-s * 1.1, -s * 0.7, s * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        const trunkWobble = Math.sin(time * 1.5) * 0.1;
        ctx.beginPath();
        ctx.moveTo(-s * 1.4, -s * 0.7);
        ctx.quadraticCurveTo(-s * 1.8 + trunkWobble * s, -s * 0.2, -s * 1.5, s * 0.4);
        ctx.lineWidth = s * 0.2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = COLORS.mammothBody;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-s * 1.2, -s * 0.4);
        ctx.quadraticCurveTo(-s * 2.2, -s * 0.2, -s * 2.0, -s * 0.8);
        ctx.lineWidth = s * 0.1;
        ctx.strokeStyle = COLORS.mammothTusk;
        ctx.stroke();

        ctx.restore();
      }
    }

    function drawPineTree(t, time) {
      const x = t.x * W;
      const y = t.y * H;
      const sizeH = t.scale * H * 0.25;
      const sizeW = sizeH * 0.5;
      
      const sway = Math.sin(time * 0.5 + t.swayPhase) * (sizeW * 0.1);
      
      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = '#0b111a';
      ctx.fillRect(-sizeW*0.05 + sway * 0.1, 0, sizeW*0.1, sizeH*0.2);

      const layers = 4;
      for (let i = 0; i < layers; i++) {
        const layerScale = 1 - (i / layers) * 0.6;
        const layerY = -sizeH * 0.2 - (i * sizeH * 0.2);
        const layerW = sizeW * layerScale;
        const layerH = sizeH * 0.35 * layerScale;
        const currentSway = sway * (1 + i * 0.5);

        ctx.beginPath();
        ctx.moveTo(-layerW + currentSway*0.5, layerY);
        ctx.lineTo(currentSway, layerY - layerH);
        ctx.lineTo(layerW + currentSway*0.5, layerY);
        ctx.closePath();

        ctx.fillStyle = COLORS.pineDark;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-layerW*0.2 + currentSway*0.5, layerY - layerH*0.2);
        ctx.lineTo(currentSway, layerY - layerH);
        ctx.lineTo(layerW*0.9 + currentSway*0.5, layerY);
        ctx.lineTo(layerW*0.4 + currentSway*0.5, layerY);
        ctx.closePath();
        
        ctx.fillStyle = `rgba(203, 213, 225, ${0.4 + i*0.1})`; 
        ctx.fill();
      }

      ctx.restore();
    }


  drawSky(time);
  drawSun(time);
  drawMountains(MOUNTAINS_FAR, COLORS.mountainFar, H * 0.55);
  drawMountains(MOUNTAINS_NEAR, COLORS.mountainNear, H * 0.60);
  drawGround(time);
  drawRoad(time);
  drawVillage();
  drawMammoths(time);
  for(const tree of TREES) {
    if (tree.scale < 0.4) drawPineTree(tree, time);
  }
  for(const tree of TREES) {
    if (tree.scale >= 0.4) drawPineTree(tree, time);
  }

  console.log("No crash!");
} catch (err) {
  console.error("Crash!", err);
}
