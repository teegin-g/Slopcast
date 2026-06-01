import React, { useMemo } from 'react';

interface LaunchpadHeroProps {
  children: React.ReactNode;
}

// Deterministic pseudo-random so the scene is stable across renders.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VB_W = 1200;
const VB_H = 520;

/**
 * Atmospheric "acreage" backdrop: a township/range section grid, a scatter of
 * well pads, and a few horizontal laterals. Decorative only (aria-hidden),
 * themed via CSS tokens; motion is gated behind prefers-reduced-motion in CSS.
 */
const LaunchpadHero: React.FC<LaunchpadHeroProps> = ({ children }) => {
  const { pads, laterals } = useMemo(() => {
    const rand = mulberry32(42);
    const padList: { x: number; y: number; r: number; bright: boolean }[] = [];
    for (let i = 0; i < 64; i += 1) {
      padList.push({
        x: rand() * VB_W,
        y: rand() * VB_H,
        r: 1.4 + rand() * 2.2,
        bright: rand() > 0.78,
      });
    }
    const lateralList: { x: number; y: number; len: number }[] = [];
    for (let i = 0; i < 9; i += 1) {
      lateralList.push({
        x: 120 + rand() * (VB_W - 360),
        y: 60 + rand() * (VB_H - 120),
        len: 90 + rand() * 200,
      });
    }
    return { pads: padList, laterals: lateralList };
  }, []);

  const cols = 12;
  const rows = 5;

  return (
    <div className="lp-hero">
      <div className="lp-hero__scene" aria-hidden="true">
        <svg className="lp-hero__svg" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="lp-hero-glow" cx="50%" cy="38%" r="62%">
              <stop offset="0%" stopColor="rgb(var(--cyan))" stopOpacity="0.20" />
              <stop offset="45%" stopColor="rgb(var(--cyan))" stopOpacity="0.05" />
              <stop offset="100%" stopColor="rgb(var(--cyan))" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="lp-hero-glow2" cx="78%" cy="78%" r="50%">
              <stop offset="0%" stopColor="rgb(var(--magenta))" stopOpacity="0.14" />
              <stop offset="100%" stopColor="rgb(var(--magenta))" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#lp-hero-glow)" />
          <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#lp-hero-glow2)" />

          {/* Section grid */}
          <g className="lp-hero__grid">
            {Array.from({ length: cols + 1 }).map((_, i) => (
              <line key={`v${i}`} x1={(VB_W / cols) * i} y1={0} x2={(VB_W / cols) * i} y2={VB_H} />
            ))}
            {Array.from({ length: rows + 1 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={(VB_H / rows) * i} x2={VB_W} y2={(VB_H / rows) * i} />
            ))}
          </g>

          {/* Laterals */}
          <g className="lp-hero__laterals">
            {laterals.map((l, i) => (
              <g key={i}>
                <line x1={l.x} y1={l.y} x2={l.x + l.len} y2={l.y} />
                <circle cx={l.x} cy={l.y} r={2.4} className="lp-hero__heel" />
              </g>
            ))}
          </g>

          {/* Well pads */}
          <g className="lp-hero__pads">
            {pads.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={p.r} className={p.bright ? 'lp-hero__pad lp-hero__pad--bright' : 'lp-hero__pad'} />
            ))}
          </g>
        </svg>
        <div className="lp-hero__vignette" />
      </div>

      <div className="lp-hero__content">{children}</div>
    </div>
  );
};

export default LaunchpadHero;
