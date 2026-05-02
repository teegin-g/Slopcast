import type React from 'react';
import type { ThemeDefinition, ThemeId, ThemeVariant } from '../types';

export type ThemeRendererKind = 'none' | 'css' | 'svg' | 'canvas2d' | 'r3f';

export type ThemeSceneFxMode = 'cinematic' | 'max';

export type ThemeDeviceTier = 'low' | 'standard' | 'high';

export type ThemeSceneQuality = 'static' | 'cinematic' | 'max';

export interface ThemeSceneRuntimeProps {
  themeId: ThemeId;
  effectiveMode: ThemeVariant;
  fxMode: ThemeSceneFxMode;
  reducedMotion: boolean;
  paused: boolean;
  deviceTier: ThemeDeviceTier;
}

export interface ThemeSceneConfig {
  renderer: ThemeRendererKind;
  component?: React.ComponentType<Partial<ThemeSceneRuntimeProps>>;
  fallbackComponent?: React.ComponentType<Partial<ThemeSceneRuntimeProps>>;
  supportsFx: boolean;
  requiresWebGL: boolean;
  pauseWhenHidden: boolean;
  respectsReducedMotion: boolean;
  quality?: ThemeSceneQuality;
  ownsVignette?: boolean;
  ownsGrain?: boolean;
  ownsAtmosphericOverlays?: boolean;
}

export interface ThemeSceneLayerProps {
  theme: ThemeDefinition;
  effectiveMode: ThemeVariant;
  fxMode: ThemeSceneFxMode;
  pageOverlayClasses?: readonly string[];
  fxClass?: string;
  className?: string;
}

export interface UseThemeSceneRuntimeInput {
  theme: ThemeDefinition;
  effectiveMode: ThemeVariant;
  fxMode: ThemeSceneFxMode;
  scene: ThemeSceneConfig;
}
