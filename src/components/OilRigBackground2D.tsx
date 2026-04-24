import { useEffect, useRef } from 'react';
import {
  hillY,
  RIDGE_LAYERS,
  PUMPJACK_SLOTS,
  type PumpjackSlot,
} from './permian/hillNoise';
import { paletteForMode, type PermianMode, type PermianPalette } from './permian/variants';

/**
 * OilRigBackground2D — pure 2D Canvas fallback for the Permian theme. Used
 * when WebGL2 is unavailable, the device reports limited resources
 * (`hardwareConcurrency < 4` or `deviceMemory < 4`), or the `?permianFallback=1`
 * hint is present. Mirrors the 3D scene's layout (same ridges via shared
 * `hillY`, same pumpjack slots) so the theme reads the same either way.
 *
 * This is intentionally simpler than the 3D version — no particles, no
 * post-FX, minimal animation — but keeps the overall silhouette recognisable.
 */

const TAU = Math.PI * 2;

interface Props {
  /** Optional override; otherwise we read document.documentElement.dataset.mode. */
  mode?: PermianMode;
}

function getDocumentMode(): PermianMode {
  if (typeof document === 'undefined') return 'dusk';
  return document.documentElement.dataset.mode === 'light' ? 'noon' : 'dusk';
}

export default function OilRigBackground2D({ mode }: Props = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduceMotion = motionQuery?.matches ?? false;
    let activeMode: PermianMode = mode ?? getDocumentMode();
    let palette: PermianPalette = paletteForMode(activeMode);

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth * dpr;
      H = window.innerHeight * dpr;
      canvas!.width = W;
      canvas!.height = H;
      if (reduceMotion) draw(0);
    }

    function drawSky() {
      const grad = ctx!.createLinearGradient(0, 0, 0, H * 0.75);
      grad.addColorStop(0, palette.skyTop);
      grad.addColorStop(0.45, palette.skyMid);
      grad.addColorStop(0.75, palette.skyLow);
      grad.addColorStop(1, palette.skyHorizon);
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);
    }

    function drawSun() {
      const cx = palette.sunX * W;
      const cy = palette.sunY * H;
      const r = palette.sunRadius * Math.min(W, H) * 3;
      const halo = ctx!.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.5);
      halo.addColorStop(0, palette.sun);
      halo.addColorStop(0.4, palette.sun + '80');
      halo.addColorStop(1, palette.sun + '00');
      ctx!.fillStyle = halo;
      ctx!.beginPath();
      ctx!.arc(cx, cy, r * 2.5, 0, TAU);
      ctx!.fill();

      ctx!.fillStyle = palette.sun;
      ctx!.beginPath();
      ctx!.arc(cx, cy, r * 0.55, 0, TAU);
      ctx!.fill();
    }

    function drawRidges() {
      for (let li = 0; li < RIDGE_LAYERS.length; li++) {
        const layer = RIDGE_LAYERS[li];
        const color = palette.ridgeColors[li];
        const opacity = palette.ridgeOpacity[li];
        ctx!.fillStyle = color;
        ctx!.globalAlpha = opacity;
        ctx!.beginPath();
        ctx!.moveTo(0, H);
        const steps = 160;
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const x = u * W;
          const dy = hillY(layer.seed, u, layer.amp);
          const y = (layer.y + dy) * H;
          ctx!.lineTo(x, y);
        }
        ctx!.lineTo(W, H);
        ctx!.closePath();
        ctx!.fill();

        // Teal glow edge
        if (palette.ridgeGlowAlpha[li] > 0.01) {
          ctx!.globalAlpha = palette.ridgeGlowAlpha[li];
          ctx!.strokeStyle = palette.ridgeGlow;
          ctx!.lineWidth = Math.max(1, Math.min(W, H) * 0.0016);
          ctx!.beginPath();
          for (let i = 0; i <= steps; i++) {
            const u = i / steps;
            const x = u * W;
            const dy = hillY(layer.seed, u, layer.amp);
            const y = (layer.y + dy) * H;
            if (i === 0) ctx!.moveTo(x, y);
            else ctx!.lineTo(x, y);
          }
          ctx!.stroke();
        }
      }
      ctx!.globalAlpha = 1;
    }

    function drawGround() {
      const y0 = (RIDGE_LAYERS[RIDGE_LAYERS.length - 1].y + 0.02) * H;
      const grad = ctx!.createLinearGradient(0, y0, 0, H);
      grad.addColorStop(0, palette.groundTop);
      grad.addColorStop(0.5, palette.groundMid);
      grad.addColorStop(1, palette.groundBottom);
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, y0, W, H - y0);
    }

    function drawPumpjack(slot: PumpjackSlot, t: number) {
      const ridge = RIDGE_LAYERS.find(r => r.name === slot.ridge)!;
      const baseX = slot.xNorm * W;
      const baseY = (ridge.y + hillY(ridge.seed, slot.xNorm, ridge.amp)) * H;
      const unit = Math.min(W, H) * 0.015 * slot.scale;

      ctx!.save();
      ctx!.translate(baseX, baseY);
      ctx!.fillStyle = palette.rigSteel;
      ctx!.fillRect(-unit * 1.8, -unit * 0.4, unit * 3.6, unit * 0.4);

      const postX = 0;
      const postHeight = unit * 3;
      ctx!.fillRect(postX - unit * 0.15, -postHeight, unit * 0.3, postHeight - unit * 0.4);

      const rockAngle = reduceMotion ? 0 : Math.sin(t * 0.8 + slot.phase) * 0.35;
      const pivotY = -postHeight + unit * 0.4;
      const beamLen = unit * 3.5;
      ctx!.save();
      ctx!.translate(postX, pivotY);
      ctx!.rotate(-rockAngle);
      ctx!.fillStyle = palette.rigSteel;
      ctx!.fillRect(-beamLen * 0.5, -unit * 0.1, beamLen * 1.1, unit * 0.2);
      ctx!.fillStyle = palette.rigLight;
      ctx!.beginPath();
      ctx!.arc(-beamLen * 0.45, 0, unit * 0.35, 0, TAU);
      ctx!.fill();
      ctx!.fillStyle = palette.rigDark;
      ctx!.beginPath();
      ctx!.arc(-beamLen * 0.45, 0, unit * 0.22, 0, TAU);
      ctx!.fill();
      ctx!.restore();

      ctx!.restore();
    }

    function drawDerrick(t: number) {
      const baseX = W * 0.48;
      const baseY = 0.66 * H;
      const rigH = H * 0.22;
      const rigW = Math.min(W, H) * 0.11;

      ctx!.save();
      ctx!.translate(baseX, baseY);
      ctx!.strokeStyle = palette.rigSteel;
      ctx!.lineWidth = Math.max(1.4, rigW * 0.02);
      // Two outer legs
      ctx!.beginPath();
      ctx!.moveTo(-rigW * 0.55, 0);
      ctx!.lineTo(-rigW * 0.06, -rigH);
      ctx!.moveTo(rigW * 0.55, 0);
      ctx!.lineTo(rigW * 0.06, -rigH);
      ctx!.stroke();

      // Rungs
      ctx!.lineWidth = Math.max(1, rigW * 0.012);
      const rungs = 18;
      for (let i = 1; i < rungs; i++) {
        const k = i / rungs;
        const lx = -rigW * 0.55 * (1 - k) - rigW * 0.06 * k;
        const rx = rigW * 0.55 * (1 - k) + rigW * 0.06 * k;
        const y = -rigH * k;
        ctx!.beginPath();
        ctx!.moveTo(lx, y);
        ctx!.lineTo(rx, y);
        ctx!.stroke();
      }

      // Crown block
      ctx!.fillStyle = palette.rigLight;
      ctx!.fillRect(-rigW * 0.18, -rigH - rigH * 0.015, rigW * 0.36, rigH * 0.015);

      // Traveling block
      const drill = reduceMotion ? 0.3 : 0.5 + Math.sin(t * 0.3) * 0.5;
      const tbY = -rigH * 0.72 + drill * rigH * 0.28;
      ctx!.fillStyle = palette.rigOrange;
      ctx!.fillRect(-rigW * 0.18, tbY, rigW * 0.36, rigH * 0.025);

      // Orange flag + warning light
      ctx!.fillStyle = palette.rigRed;
      const pulse = reduceMotion ? 0.6 : (Math.sin(t * 5) > 0.25 ? 1 : 0.3);
      ctx!.globalAlpha = pulse;
      ctx!.beginPath();
      ctx!.arc(0, -rigH - rigH * 0.05, rigW * 0.03, 0, TAU);
      ctx!.fill();
      ctx!.globalAlpha = 1;

      ctx!.restore();
    }

    function draw(t: number) {
      const time = t * 0.001;
      ctx!.clearRect(0, 0, W, H);
      drawSky();
      drawSun();
      drawRidges();
      drawGround();
      drawDerrick(time);
      for (const slot of PUMPJACK_SLOTS) drawPumpjack(slot, time);

      // Subtle vignette
      const vg = ctx!.createRadialGradient(W * 0.5, H * 0.5, W * 0.3, W * 0.5, H * 0.6, W * 0.8);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(0,0,0,${palette.vignetteDarkness})`);
      ctx!.fillStyle = vg;
      ctx!.fillRect(0, 0, W, H);

      if (reduceMotion) return;
      rafRef.current = requestAnimationFrame(draw);
    }

    const onModeChange = () => {
      activeMode = mode ?? getDocumentMode();
      palette = paletteForMode(activeMode);
      if (reduceMotion) draw(0);
    };

    resize();
    window.addEventListener('resize', resize);

    const observer = new MutationObserver(onModeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode', 'data-theme'] });

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else if (!reduceMotion) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onMotion = () => {
      reduceMotion = motionQuery?.matches ?? false;
      cancelAnimationFrame(rafRef.current);
      if (reduceMotion) draw(0);
      else rafRef.current = requestAnimationFrame(draw);
    };
    motionQuery?.addEventListener?.('change', onMotion);

    if (reduceMotion) draw(0);
    else rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery?.removeEventListener?.('change', onMotion);
      cancelAnimationFrame(rafRef.current);
    };
  }, [mode]);

  return (
    <div
      className="permian-bg-wrap permian-bg-wrap--2d"
      style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
