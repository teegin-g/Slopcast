---
name: animated-backgrounds
description: Create cool, performant animated HTML5 Canvas backgrounds for landing pages, dashboards, product UIs, and hero sections. Use when users ask for animated backgrounds, atmospheric visuals, decorative scenes, vibe upgrades, synthwave/retro/cyberpunk/lo-fi/tropical/space/ocean/forest themes, particle effects, ambient motion, or “make it look cooler” requests. Produce self-contained background files with no external dependencies unless the user explicitly asks otherwise.
---

# Animated Backgrounds

Create immersive, performant animated background visuals with HTML5 Canvas. Prefer a single self-contained HTML file unless the user asks for framework-specific integration.

## Workflow

1. Confirm the target use: standalone wallpaper, page background layer, or component integration.
2. Choose a theme and define a semantic `COLORS` object first.
3. Set up canvas sizing with device-pixel-ratio scaling.
4. Build the scene in visual layers from back to front.
5. Animate with one `requestAnimationFrame` loop using time-based motion.
6. Add finishing atmosphere (vignette, glow, subtle particles).
7. Tune for performance and responsiveness.

## Core Build Pattern

Use this skeleton as the default starting point:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Animated Background</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 100vw; height: 100vh; overflow: hidden; background: #05070f; }
  canvas { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>
  <canvas id="bg"></canvas>
  <script>
    const canvas = document.getElementById('bg');
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;

    function resize() {
      W = canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
      H = canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
    }

    resize();
    window.addEventListener('resize', resize);

    function draw(t) {
      const time = t * 0.001;
      ctx.clearRect(0, 0, W, H);

      // draw layers here

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  </script>
</body>
</html>
```

## Layering Standard

Build scenes back-to-front and include only layers that support the selected theme:

1. Sky/background gradient
2. Distant stars/particles/haze
3. Main light source (sun/moon/planet/neon glow)
4. Midground terrain/geometry/architecture
5. Surface plane (water, dunes, grid, ground)
6. Foreground silhouettes/framing elements
7. Accent particles and post-processing (vignette/grain/scanline)

## Motion Rules

- Drive all animation from `time = t * 0.001`.
- Prefer sine/cosine-based drift, sway, pulse, and bobbing.
- Use phase offsets for per-element variety.
- Keep motion subtle; backgrounds should support UI, not compete with it.

For reusable patterns and snippets, read:
- `references/techniques.md`

## Palette Rules

- Define one `COLORS` object as a single source of truth.
- Keep 2-3 dominant hues with 1-2 accents.
- Favor low-contrast backgrounds and selective bright highlights.
- Match the app’s palette when user branding exists.

For starter palettes, read:
- `references/palettes.md`

## Performance Rules

- Reuse arrays/objects; avoid per-frame allocations where possible.
- Keep particle counts reasonable (typically 50-150).
- Batch similar draw calls.
- Avoid expensive filters unless required.
- Keep all dimensions relative to `W` and `H` to resize cleanly.

## Delivery

- Default output: one self-contained `.html` file.
- If user asks for app integration, provide a minimal integration snippet for React/Vue/etc. while preserving the same canvas renderer.
- Include brief tuning notes (which constants control speed, density, and glow) so users can tweak quickly.
