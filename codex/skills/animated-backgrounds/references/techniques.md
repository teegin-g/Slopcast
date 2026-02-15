# Animation Techniques Reference

Reusable code patterns for building animated canvas backgrounds. Each technique includes a self-contained code snippet ready to drop into a scene.

---

## Table of Contents

1. [Wave Motion](#wave-motion)
2. [Particle Systems](#particle-systems)
3. [Synthwave Grid](#synthwave-grid)
4. [Celestial Bodies](#celestial-bodies)
5. [Procedural Trees & Plants](#procedural-trees--plants)
6. [Water & Reflections](#water--reflections)
7. [Creature Animation](#creature-animation)
8. [Atmospheric Effects](#atmospheric-effects)
9. [Post-Processing](#post-processing)
10. [Gradient Techniques](#gradient-techniques)
11. [Noise & Randomness](#noise--randomness)

---

## Wave Motion

The foundation of organic animation. Nearly everything uses sine/cosine waves.

### Basic Sway (trees, grass, flags)
```javascript
// sway oscillates between -amplitude and +amplitude
const sway = Math.sin(time * speed) * amplitude;
// Example: palm tree frond sway
const frondSway = Math.sin(time * 1.0) * 0.04; // radians
```

### Bobbing (floating objects, boats)
```javascript
const bobY = Math.sin(time * 1.5) * 8; // pixels up/down
const bobX = Math.cos(time * 0.7) * 3; // slight horizontal drift
```

### Compound Motion (natural-feeling drift)
Combine multiple sine waves at different frequencies for organic, non-repetitive motion:
```javascript
const x = baseX + Math.sin(time * 0.3 + phase) * 20 + Math.sin(time * 0.7) * 5;
const y = baseY + Math.cos(time * 0.5 + phase) * 10 + Math.sin(time * 1.1) * 3;
```

### Pulsing (glow, breathing, heartbeat)
```javascript
const alpha = 0.3 + Math.sin(time * 2) * 0.15; // oscillates 0.15 to 0.45
const scale = 1 + Math.sin(time * 1.5) * 0.05; // 5% size pulse
```

### Twinkle (stars)
Each star gets a unique phase and speed:
```javascript
const stars = Array.from({length: 120}, () => ({
  x: Math.random(), y: Math.random() * 0.4,
  r: Math.random() * 1.5 + 0.3,
  phase: Math.random() * Math.PI * 2,
  speed: Math.random() * 1.5 + 0.5,
}));

function drawStars(time) {
  stars.forEach(s => {
    const alpha = 0.3 + Math.sin(time * s.speed + s.phase) * 0.3;
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0.05, alpha)})`;
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
}
```

---

## Particle Systems

### Basic Particle System Template
```javascript
class Particle {
  constructor() { this.reset(); }

  reset() {
    this.x = Math.random();
    this.y = Math.random();
    this.size = Math.random() * 2 + 0.5;
    this.speed = (Math.random() * 0.5 + 0.2) * 0.0002;
    this.phase = Math.random() * Math.PI * 2;
    this.life = 1;
  }

  update(time) {
    this.x += Math.sin(time * 0.5 + this.phase) * 0.0005;
    this.y -= this.speed; // drift upward
    if (this.y < 0) this.reset();
  }

  draw(time) {
    const alpha = 0.2 + Math.sin(time * 2 + this.phase) * 0.2;
    ctx.fillStyle = `rgba(20, 217, 160, ${Math.max(0, alpha)})`;
    ctx.beginPath();
    ctx.arc(this.x * W, this.y * H, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

const particles = Array.from({length: 40}, () => new Particle());

function drawParticles(time) {
  particles.forEach(p => { p.update(time); p.draw(time); });
}
```

### Themed Particle Variants
- **Fireflies**: Yellow-green, slow drift, random alpha flicker, concentrated in lower half
- **Snow**: White, drift down + slight horizontal sine, varying sizes
- **Rain**: Thin vertical lines, fast downward, slight angle, splash on impact
- **Bubbles**: Rise upward, wobble horizontally, slight size pulse, pop at top
- **Embers**: Orange-red, rise from bottom, fade as they go up, slight swirl
- **Dust motes**: Slow random drift, barely visible, catch light occasionally
- **Stars (shooting)**: Rare spawn, fast diagonal, trail fade behind

---

## Synthwave Grid

The iconic retrowave perspective grid on a ground plane.

```javascript
function drawSynthwaveGrid(time, horizonY) {
  // Horizontal lines with perspective compression
  ctx.strokeStyle = 'rgba(20, 217, 160, 0.08)';
  ctx.lineWidth = 1;

  const numH = 25;
  for (let i = 0; i < numH; i++) {
    const t = i / numH;
    const y = horizonY + Math.pow(t, 1.8) * (H - horizonY); // power curve = perspective
    const waveOffset = Math.sin(time * 0.8 + i * 0.5) * 3;

    ctx.globalAlpha = t * 0.6; // fade near horizon
    ctx.beginPath();
    ctx.moveTo(0, y + waveOffset);
    // Optional: add wave undulation across the line
    for (let x = 0; x <= W; x += W / 40) {
      const wave = Math.sin(time + x * 0.003 + i * 0.3) * (2 + t * 5);
      ctx.lineTo(x, y + waveOffset + wave);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Vertical converging lines toward vanishing point
  const numV = 20;
  const vanishX = W * 0.5;
  ctx.strokeStyle = 'rgba(20, 217, 160, 0.05)';
  for (let i = 0; i < numV; i++) {
    const spread = (i - numV / 2) / (numV / 2);
    ctx.beginPath();
    ctx.moveTo(vanishX, horizonY);
    ctx.lineTo(vanishX + spread * W * 0.8, H);
    ctx.stroke();
  }
}
```

**Scrolling variant**: Offset horizontal line positions by `(time * scrollSpeed) % spacing` to create the effect of flying over the grid.

---

## Celestial Bodies

### Sun with Synthwave Slices
```javascript
function drawSun(time, cx, cy, r) {
  // Outer glow rings
  for (let i = 4; i > 0; i--) {
    const glowR = r * (1 + i * 0.6);
    const alpha = 0.04 * (1 + Math.sin(time + i) * 0.3);
    const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, glowR);
    grad.addColorStop(0, `rgba(255, 159, 28, ${alpha})`);
    grad.addColorStop(1, 'rgba(255, 107, 53, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sun body with gradient
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  const grad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  grad.addColorStop(0, '#ff6b35');
  grad.addColorStop(0.5, '#ff9f1c');
  grad.addColorStop(1, '#ffe66d');
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Horizontal slice cutouts (synthwave signature)
  ctx.fillStyle = '#0d2137'; // match sky color
  const sliceCount = 8;
  for (let i = 0; i < sliceCount; i++) {
    const sliceY = cy + r * 0.1 + (i / sliceCount) * r * 0.9;
    const sliceH = (i + 1) * 1.2; // slices get thicker toward bottom
    ctx.fillRect(cx - r, sliceY, r * 2, sliceH);
  }
  ctx.restore();
}
```

### Moon with Craters
```javascript
function drawMoon(cx, cy, r) {
  // Glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 3);
  glow.addColorStop(0, 'rgba(200, 210, 230, 0.1)');
  glow.addColorStop(1, 'rgba(200, 210, 230, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, r * 3, 0, Math.PI * 2); ctx.fill();

  // Body
  const bodyGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  bodyGrad.addColorStop(0, '#e8e0d0');
  bodyGrad.addColorStop(1, '#b0a890');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

  // Craters
  const craters = [[0.2, -0.3, 0.15], [-0.25, 0.15, 0.12], [0.1, 0.25, 0.08]];
  craters.forEach(([ox, oy, cr]) => {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.arc(cx + ox * r, cy + oy * r, cr * r, 0, Math.PI * 2);
    ctx.fill();
  });
}
```

---

## Procedural Trees & Plants

### Palm Tree
The palm tree is built from a segmented trunk + radial fronds with leaf pairs.

```javascript
function drawPalmTree(x, y, height, sway, lean = 0) {
  const trunkW = height * 0.04;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);

  // Segmented trunk
  const segs = 15;
  for (let i = 0; i < segs; i++) {
    const t1 = i / segs, t2 = (i + 1) / segs;
    const w1 = trunkW * (1 - t1 * 0.4), w2 = trunkW * (1 - t2 * 0.4);
    const shade = i % 2 === 0 ? 0.7 : 0.78;
    ctx.fillStyle = `rgba(26, 48, 37, ${shade})`;
    ctx.beginPath();
    ctx.moveTo(-w1, -t1 * height);
    ctx.lineTo(w1, -t1 * height);
    ctx.lineTo(w2, -t2 * height);
    ctx.lineTo(-w2, -t2 * height);
    ctx.closePath(); ctx.fill();
  }

  // Fronds — 6-8 radiating from the crown
  const frondLen = height * 0.55;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    drawFrond(0, -height, angle, frondLen, sway * (0.8 + Math.sin(i) * 0.3));
  }

  // Coconuts
  ctx.fillStyle = '#5a3a1a';
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * trunkW * 1.5, -height + Math.sin(a) * trunkW + trunkW, height * 0.02, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFrond(cx, cy, angle, length, sway) {
  const segments = 20;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle + sway);

  // Stem
  ctx.strokeStyle = '#0b5e34';
  ctx.lineWidth = Math.max(1, length * 0.03);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    ctx.lineTo(t * length, Math.sin(t * Math.PI * 0.8) * length * 0.15);
  }
  ctx.stroke();

  // Leaf pairs
  for (let i = 2; i <= segments; i++) {
    const t = i / segments;
    const x = t * length;
    const y = Math.sin(t * Math.PI * 0.8) * length * 0.15;
    const leafLen = length * 0.18 * (1 - t * 0.5);

    ctx.fillStyle = `rgba(13, 107, 58, ${0.7 - t * 0.3})`;
    // Top leaf
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + leafLen * 0.3, y - leafLen * 0.7, x + leafLen * 0.1, y - leafLen);
    ctx.quadraticCurveTo(x - leafLen * 0.1, y - leafLen * 0.5, x, y);
    ctx.fill();
    // Bottom leaf (mirror)
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + leafLen * 0.3, y + leafLen * 0.7, x + leafLen * 0.1, y + leafLen);
    ctx.quadraticCurveTo(x - leafLen * 0.1, y + leafLen * 0.5, x, y);
    ctx.fill();
  }
  ctx.restore();
}
```

### Conifer / Pine Tree (silhouette)
```javascript
function drawPineTree(x, y, height, width) {
  ctx.fillStyle = '#0a2a15';
  // Trunk
  ctx.fillRect(x - width * 0.06, y - height * 0.1, width * 0.12, height * 0.1);
  // Triangular layers
  for (let i = 0; i < 4; i++) {
    const layerY = y - height * 0.1 - (i / 4) * height * 0.9;
    const layerW = width * (1 - i * 0.2) * 0.5;
    const layerH = height * 0.35;
    ctx.beginPath();
    ctx.moveTo(x, layerY - layerH);
    ctx.lineTo(x + layerW, layerY);
    ctx.lineTo(x - layerW, layerY);
    ctx.closePath(); ctx.fill();
  }
}
```

### Cactus
```javascript
function drawCactus(x, y, height) {
  const w = height * 0.12;
  ctx.fillStyle = '#2d6b30';
  // Main trunk
  roundRect(ctx, x - w, y - height, w * 2, height, w);
  // Left arm
  ctx.beginPath();
  ctx.moveTo(x - w, y - height * 0.5);
  ctx.lineTo(x - w * 3, y - height * 0.5);
  ctx.lineTo(x - w * 3, y - height * 0.8);
  ctx.lineTo(x - w * 2, y - height * 0.8);
  ctx.lineTo(x - w * 2, y - height * 0.4);
  ctx.lineTo(x - w, y - height * 0.4);
  ctx.fill();
}
```

---

## Water & Reflections

### Ocean with Shimmer
```javascript
function drawOcean(time, horizonY) {
  // Base gradient
  const grad = ctx.createLinearGradient(0, horizonY, 0, H);
  grad.addColorStop(0, '#0a2a3a');
  grad.addColorStop(0.5, '#061a28');
  grad.addColorStop(1, '#030e18');
  ctx.fillStyle = grad;
  ctx.fillRect(0, horizonY, W, H - horizonY);

  // Shimmer lines
  for (let i = 0; i < 30; i++) {
    const rx = (Math.sin(time * 0.3 + i * 7.3) * 0.5 + 0.5) * W;
    const ry = horizonY + Math.pow(Math.random(), 0.5) * (H - horizonY) * 0.7;
    const rw = 10 + Math.random() * 40;
    const alpha = 0.02 + Math.sin(time * 2 + i * 3) * 0.015;
    ctx.fillStyle = `rgba(20, 217, 160, ${Math.max(0, alpha)})`;
    ctx.fillRect(rx - rw / 2, ry, rw, 1.5);
  }
}
```

### Sun/Moon Reflection Column
```javascript
function drawReflection(cx, horizonY, bottomY, color, width) {
  const grad = ctx.createLinearGradient(cx, horizonY, cx, bottomY);
  grad.addColorStop(0, color.replace(')', ', 0.12)').replace('rgb', 'rgba'));
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx - width * 0.3, horizonY);
  ctx.lineTo(cx + width * 0.3, horizonY);
  ctx.lineTo(cx + width * 0.5, bottomY);
  ctx.lineTo(cx - width * 0.5, bottomY);
  ctx.closePath();
  ctx.fill();
}
```

---

## Creature Animation

### Flying Bird / Parrot
```javascript
class Bird {
  constructor(x, y, size, delay) {
    this.baseX = x; this.baseY = y;
    this.size = size; this.delay = delay;
    this.flapPhase = Math.random() * Math.PI * 2;
  }

  draw(time) {
    const t = time + this.delay;
    const x = (this.baseX + Math.sin(t * 0.3) * 0.03) * W;
    const y = (this.baseY + Math.sin(t * 0.5) * 0.015) * H;
    const s = this.size * Math.min(W, H) * 0.001;
    const wingAngle = Math.sin(t * 6 + this.flapPhase) * 0.6;

    ctx.save();
    ctx.translate(x, y);

    // Body ellipse
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 3, s * 1.2, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Wing (animated)
    ctx.save();
    ctx.rotate(wingAngle);
    ctx.fillStyle = '#14d9a0';
    ctx.beginPath();
    ctx.ellipse(-s * 0.5, -s * 1, s * 2.5, s * 1, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tail
    ctx.fillStyle = '#14d9a0';
    ctx.beginPath();
    ctx.moveTo(-s * 2.5, 0);
    ctx.quadraticCurveTo(-s * 4, s * 0.8, -s * 5, s * 1.5);
    ctx.quadraticCurveTo(-s * 3.5, s * 0.3, -s * 2.5, -s * 0.3);
    ctx.closePath(); ctx.fill();

    ctx.restore();
  }
}
```

### Swimming Fish
```javascript
class Fish {
  constructor(y, speed, size) {
    this.x = Math.random();
    this.y = y;
    this.speed = speed;
    this.size = size;
    this.tailPhase = Math.random() * Math.PI * 2;
  }

  draw(time) {
    const x = ((this.x + time * this.speed) % 1.2 - 0.1) * W;
    const y = this.y * H + Math.sin(time * 2 + this.tailPhase) * 5;
    const s = this.size;
    const tailWag = Math.sin(time * 8 + this.tailPhase) * 0.3;

    ctx.save(); ctx.translate(x, y);
    // Body
    ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 2, s * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tail
    ctx.save(); ctx.translate(-s * 1.8, 0); ctx.rotate(tailWag);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-s * 1.2, -s * 0.8);
    ctx.lineTo(-s * 1.2, s * 0.8);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}
```

---

## Atmospheric Effects

### Drifting Clouds
```javascript
const clouds = Array.from({length: 6}, () => ({
  x: Math.random() * 1.4 - 0.2,
  y: 0.08 + Math.random() * 0.2,
  w: 0.08 + Math.random() * 0.15,
  h: 0.01 + Math.random() * 0.015,
  speed: (Math.random() * 0.3 + 0.1) * 0.0001,
  opacity: 0.15 + Math.random() * 0.2,
}));

function drawClouds() {
  clouds.forEach(c => {
    c.x += c.speed;
    if (c.x > 1.3) c.x = -0.2;
    const grad = ctx.createRadialGradient(c.x * W, c.y * H, 0, c.x * W, c.y * H, c.w * W);
    grad.addColorStop(0, `rgba(200, 220, 240, ${c.opacity})`);
    grad.addColorStop(1, 'rgba(200, 220, 240, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(c.x * W, c.y * H, c.w * W, c.h * H, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}
```

### Rain
```javascript
const raindrops = Array.from({length: 200}, () => ({
  x: Math.random(), y: Math.random(),
  speed: 0.01 + Math.random() * 0.02,
  length: 10 + Math.random() * 20,
}));

function drawRain(time) {
  ctx.strokeStyle = 'rgba(150, 180, 220, 0.3)';
  ctx.lineWidth = 1;
  raindrops.forEach(r => {
    r.y += r.speed;
    if (r.y > 1) { r.y = -0.05; r.x = Math.random(); }
    const x = r.x * W;
    const y = r.y * H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y + r.length);
    ctx.stroke();
  });
}
```

### Aurora Borealis
```javascript
function drawAurora(time) {
  const bands = 5;
  for (let b = 0; b < bands; b++) {
    ctx.beginPath();
    const baseY = H * (0.15 + b * 0.06);
    ctx.moveTo(0, baseY);

    for (let x = 0; x <= W; x += 10) {
      const t = x / W;
      const y = baseY
        + Math.sin(t * 4 + time * 0.5 + b) * H * 0.05
        + Math.sin(t * 7 + time * 0.3) * H * 0.02;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H * 0.5);
    ctx.lineTo(0, H * 0.5);
    ctx.closePath();

    const hue = 120 + b * 30 + Math.sin(time + b) * 20; // green → purple
    ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.04)`;
    ctx.fill();
  }
}
```

---

## Post-Processing

### Vignette
```javascript
function drawVignette(intensity = 0.4) {
  const grad = ctx.createRadialGradient(W/2, H/2, W*0.2, W/2, H/2, W*0.7);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${intensity})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}
```

### Scanlines (CRT effect)
```javascript
function drawScanlines(opacity = 0.03) {
  ctx.fillStyle = `rgba(0,0,0,${opacity})`;
  for (let y = 0; y < H; y += 3) {
    ctx.fillRect(0, y, W, 1);
  }
}
```

### Film Grain
```javascript
function drawGrain(opacity = 0.02) {
  const imageData = ctx.getImageData(0, 0, W, H);
  const data = imageData.data;
  // NOTE: This is slow at high res. Use sparingly or on a smaller canvas.
  for (let i = 0; i < data.length; i += 16) { // skip pixels for perf
    const noise = (Math.random() - 0.5) * 255 * opacity;
    data[i] += noise;
    data[i+1] += noise;
    data[i+2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);
}
```

---

## Gradient Techniques

### Multi-stop Sky Gradient
```javascript
const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
sky.addColorStop(0, '#0a0f1e');    // deep space
sky.addColorStop(0.5, '#0d2137');  // mid atmosphere
sky.addColorStop(0.85, '#1a3a4a'); // approaching horizon
sky.addColorStop(1, '#0f3542');    // horizon line
ctx.fillStyle = sky;
ctx.fillRect(0, 0, W, H * 0.55);
```

### Radial Glow Behind Object
```javascript
function drawGlow(cx, cy, radius, color, alpha = 0.1) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}
```

---

## Noise & Randomness

### Deterministic Pseudo-Random (seeded positions)
For elements that should look random but stay consistent across frames:
```javascript
function seededRandom(seed) {
  let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
// Usage: position = seededRandom(i * 42 + 7)
```

### Smooth Noise (for terrain, clouds)
Approximate smooth noise using layered sine waves:
```javascript
function smoothNoise(x, y, time) {
  return (
    Math.sin(x * 1.0 + time * 0.3) * 0.5 +
    Math.sin(y * 1.5 + time * 0.2) * 0.3 +
    Math.sin((x + y) * 0.7 + time * 0.5) * 0.2
  );
}
```

### Mountain Silhouette Generator
```javascript
function drawMountains(baseY, height, color, seed = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  for (let x = 0; x <= W; x += 4) {
    const t = x / W;
    const y = baseY - height * (
      0.3 * Math.sin(t * 3 + seed) +
      0.5 * Math.sin(t * 7 + seed * 2) +
      0.2 * Math.sin(t * 13 + seed * 3)
    );
    ctx.lineTo(x, Math.max(baseY - height, y));
  }
  ctx.lineTo(W, baseY);
  ctx.closePath();
  ctx.fill();
}
```
