import React from 'react';

export const SynthwaveBackground = React.lazy(() => import('../components/SynthwaveBackground'));
export const MoonlightBackground = React.lazy(() => import('../components/MoonlightBackground'));
export const TropicalBackground = React.lazy(() => import('../components/TropicalBackground'));
export const MarioOverworldBackground = React.lazy(() => import('../components/MarioOverworldBackground'));
export const StormDuskBackground = React.lazy(() => import('../components/StormDuskBackground'));
export const HyperboreaBackground = React.lazy(() => import('../components/HyperboreaBackground'));
export const PermianBackground = React.lazy(() => import('../components/PermianBackground'));

export const THEME_BACKGROUNDS = {
  synthwave: SynthwaveBackground,
  league: MoonlightBackground,
  tropical: TropicalBackground,
  mario: MarioOverworldBackground,
  stormwatch: StormDuskBackground,
  hyperborea: HyperboreaBackground,
  permian: PermianBackground,
} as const;
