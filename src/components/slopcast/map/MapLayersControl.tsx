import React from 'react';
import { mapOverlayControlClass } from './mapOverlayChrome';

export interface MapLayerVisibility {
  heat: boolean;
  formations: boolean;
}

interface MapLayersControlProps {
  isClassic: boolean;
  visibility: MapLayerVisibility;
  onToggle: (key: keyof MapLayerVisibility) => void;
}

const iconButtonClass =
  'w-11 h-11 rounded-lg flex shrink-0 items-center justify-center touch-manipulation transition-colors';

const layerButtons: ReadonlyArray<{
  key: keyof MapLayerVisibility;
  title: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'heat',
    title: 'NPV Heat',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 1.5C8 1.5 10.5 4 10.5 7.5C10.5 9 9.5 9.5 9.5 9.5C9.5 9.5 10 8 9 6.5C9 9 7 9 7 11C7 12 7.5 12.5 7.5 12.5C5.5 12 4.5 10 4.5 8C4.5 4.5 8 1.5 8 1.5Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.25"
        />
      </svg>
    ),
  },
  {
    key: 'formations',
    title: 'Formations',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function MapLayersControl({ isClassic, visibility, onToggle }: MapLayersControlProps) {
  const labelClass = isClassic ? 'text-white/40' : 'text-[var(--text-muted)]';

  return (
    <>
      <div
        className={`text-[10px] md:text-[9px] font-bold uppercase tracking-widest px-1 py-0.5 ${labelClass}`}
      >
        Layers
      </div>
      {layerButtons.map(({ key, title, icon }) => {
        const active = visibility[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            title={title}
            aria-label={title}
            aria-pressed={active}
            data-testid={`map-layer-${key}`}
            className={`${iconButtonClass} ${mapOverlayControlClass(isClassic, active)}`}
          >
            {icon}
          </button>
        );
      })}
    </>
  );
}
