/**
 * Shared map coordinate and color utilities.
 * Used by Mapbox custom WebGL layers.
 */

const DEG2RAD = Math.PI / 180;

export function lngToMercatorX(lng: number): number {
  return (lng + 180) / 360;
}

export function latToMercatorY(lat: number): number {
  const latRad = lat * DEG2RAD;
  return (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}
