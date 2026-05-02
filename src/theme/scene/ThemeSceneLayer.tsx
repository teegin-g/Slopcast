import React, { Suspense } from 'react';
import { Vignette } from '../../components/ui/Vignette';
import { getThemeScene } from '../registry';
import { useThemeSceneRuntime } from './useThemeSceneRuntime';
import type { ThemeSceneLayerProps } from './types';

export function ThemeSceneLayer({
  theme,
  effectiveMode,
  fxMode,
  pageOverlayClasses,
  className = '',
}: ThemeSceneLayerProps) {
  const scene = getThemeScene(theme);
  const runtime = useThemeSceneRuntime({ theme, effectiveMode, fxMode, scene });
  const SceneComponent = runtime.deviceTier === 'low' && scene.fallbackComponent
    ? scene.fallbackComponent
    : scene.component;
  const overlayClasses = pageOverlayClasses ?? theme.pageOverlayClasses ?? [];

  return (
    <div
      className={className}
      data-testid="theme-scene-layer"
      data-theme-scene={theme.id}
      data-theme-renderer={scene.renderer}
      data-device-tier={runtime.deviceTier}
    >
      <div className="fixed inset-0 z-0" data-testid="theme-scene-background">
        {SceneComponent && (
          <Suspense fallback={null}>
            <SceneComponent {...runtime} />
          </Suspense>
        )}
      </div>

      {overlayClasses.map(cls => (
        <div key={cls} className={cls} data-testid="theme-page-overlay" />
      ))}

      {!scene.ownsVignette && <Vignette />}
    </div>
  );
}
