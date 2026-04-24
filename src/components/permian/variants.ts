/**
 * Permian theme variant palettes and scene tuning constants.
 *
 * Two variants modulate the same scene graph — "Dusk" (golden hour, dark
 * theme) and "Noon" (mid-day, light theme). Picked by `effectiveMode` from the
 * ThemeProvider, but also overridable at the Storybook level via a forced prop.
 */

export type PermianMode = 'dusk' | 'noon';
export type PermianFxLevel = 'cinematic' | 'max';

export interface PermianPalette {
  /** Sky gradient — top → horizon */
  skyTop: string;
  skyMid: string;
  skyLow: string;
  skyHorizon: string;
  /** Sun color and position (normalized screen coords; 0..1) */
  sun: string;
  sunX: number;
  sunY: number;
  sunRadius: number;
  /** Ridge fills (far → close) and per-ridge fog opacity */
  ridgeColors: [string, string, string, string];
  ridgeOpacity: [number, number, number, number];
  ridgeGlow: string;
  ridgeGlowAlpha: [number, number, number, number];
  /** Ground + pad */
  groundTop: string;
  groundMid: string;
  groundBottom: string;
  padColor: string;
  /** Scene actors */
  rigSteel: string;
  rigLight: string;
  rigDark: string;
  rigOrange: string;
  rigYellow: string;
  rigRed: string;
  rigCable: string;
  /** Frac spread */
  fracTruck: string;
  fracTrailer: string;
  fracTank: string;
  fracPipe: string;
  fracHose: string;
  /** Trees */
  treeTrunk: string;
  treeLeafDark: string;
  treeLeafMid: string;
  treeLeafLight: string;
  /** Workers */
  hatYellow: string;
  hatWhite: string;
  coverRed: string;
  coverBlue: string;
  /** Tuning */
  tealGlow: string;
  rigTealIntensity: number;
  flareIntensity: number;
  /** Post-FX */
  godRaysDensity: number;
  godRaysWeight: number;
  heatShimmerAmplitude: number;
  bloomIntensity: number;
  grainIntensity: number;
  vignetteDarkness: number;
}

export const DUSK_PALETTE: PermianPalette = {
  skyTop: '#0A1F18',
  skyMid: '#162F3D',
  skyLow: '#2A4A5A',
  skyHorizon: '#E87030',

  sun: '#FFA050',
  sunX: 0.78,
  sunY: 0.52, // low on horizon (0=top, 1=bottom)
  sunRadius: 0.055,

  ridgeColors: ['#0B2420', '#0A1F1A', '#081A16', '#061612'],
  ridgeOpacity: [0.75, 0.85, 0.94, 1.0],
  ridgeGlow: '#00E890',
  ridgeGlowAlpha: [0.05, 0.08, 0.11, 0.14],

  groundTop: '#0A2418',
  groundMid: '#103020',
  groundBottom: '#051A10',
  padColor: '#26362C',

  rigSteel: '#3a4550',
  rigLight: '#5a6878',
  rigDark: '#232832',
  rigOrange: '#E87030',
  rigYellow: '#F0C020',
  rigRed: '#D83020',
  rigCable: '#2a3440',

  fracTruck: '#B03820',
  fracTrailer: '#353E48',
  fracTank: '#3a4550',
  fracPipe: '#2a323a',
  fracHose: '#A02820',

  treeTrunk: '#1a2418',
  treeLeafDark: '#061A0E',
  treeLeafMid: '#0A3820',
  treeLeafLight: '#10502C',

  hatYellow: '#F0C020',
  hatWhite: '#d0d8e0',
  coverRed: '#B03820',
  coverBlue: '#1e4a80',

  tealGlow: '#00E890',
  rigTealIntensity: 2.0,
  flareIntensity: 1.0,

  godRaysDensity: 0.93,
  godRaysWeight: 0.55,
  heatShimmerAmplitude: 0.0,
  bloomIntensity: 0.9,
  grainIntensity: 0.05,
  vignetteDarkness: 0.38,
};

export const NOON_PALETTE: PermianPalette = {
  skyTop: '#1A5A7A',
  skyMid: '#2A8AAA',
  skyLow: '#48B0B8',
  skyHorizon: '#78D0C0',

  sun: '#FFF8E0',
  sunX: 0.72,
  sunY: 0.10,
  sunRadius: 0.03,

  ridgeColors: ['#1A6848', '#187050', '#14654A', '#126045'],
  ridgeOpacity: [0.7, 0.82, 0.92, 1.0],
  ridgeGlow: '#00E890',
  ridgeGlowAlpha: [0.03, 0.05, 0.07, 0.09],

  groundTop: '#0E5538',
  groundMid: '#188858',
  groundBottom: '#0A4028',
  padColor: '#5a6858',

  rigSteel: '#556070',
  rigLight: '#6a7888',
  rigDark: '#3a4450',
  rigOrange: '#E87030',
  rigYellow: '#F0C020',
  rigRed: '#D83020',
  rigCable: '#445060',

  fracTruck: '#d04828',
  fracTrailer: '#4a5565',
  fracTank: '#556070',
  fracPipe: '#3a4a55',
  fracHose: '#c83020',

  treeTrunk: '#2a3a20',
  treeLeafDark: '#0a3818',
  treeLeafMid: '#106828',
  treeLeafLight: '#189038',

  hatYellow: '#F0D020',
  hatWhite: '#E0E8F0',
  coverRed: '#c83828',
  coverBlue: '#2868b0',

  tealGlow: '#00E890',
  rigTealIntensity: 0.9,
  flareIntensity: 0.25,

  godRaysDensity: 0.78,
  godRaysWeight: 0.38,
  heatShimmerAmplitude: 1.0,
  bloomIntensity: 0.55,
  grainIntensity: 0.03,
  vignetteDarkness: 0.28,
};

export function paletteForMode(mode: PermianMode): PermianPalette {
  return mode === 'dusk' ? DUSK_PALETTE : NOON_PALETTE;
}
