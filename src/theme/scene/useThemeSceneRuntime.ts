import { useDeviceTier } from './useDeviceTier';
import { usePageVisibilityPaused } from './usePageVisibilityPaused';
import { useReducedMotionPreference } from './useReducedMotionPreference';
import type { ThemeSceneRuntimeProps, UseThemeSceneRuntimeInput } from './types';

export function useThemeSceneRuntime({
  theme,
  effectiveMode,
  fxMode,
  scene,
}: UseThemeSceneRuntimeInput): ThemeSceneRuntimeProps {
  const reducedMotion = useReducedMotionPreference();
  const visibilityPaused = usePageVisibilityPaused();
  const deviceTier = useDeviceTier({ requiresWebGL: scene.requiresWebGL });

  return {
    themeId: theme.id,
    effectiveMode,
    fxMode,
    reducedMotion: scene.respectsReducedMotion ? reducedMotion : false,
    paused: scene.pauseWhenHidden ? visibilityPaused : false,
    deviceTier,
  };
}
