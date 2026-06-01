import React from 'react';
import type { PresetProject } from '../../types';
import { formatCount } from './format';

interface PresetCarouselProps {
  presets: PresetProject[];
  loading: boolean;
  requireBasin: boolean;
  basin: string | null;
  onApply: (preset: PresetProject) => void;
}

const PresetCarousel: React.FC<PresetCarouselProps> = ({ presets, loading, requireBasin, basin, onApply }) => {
  const gated = requireBasin && !basin;

  return (
    <section className="lp-presets" aria-label="Starting points">
      <div className="lp-presets__head">
        <h2 className="lp-presets__title">Starting points</h2>
        <span className="lp-presets__note">
          {gated ? 'Pick a basin to unlock' : basin ? `Curated for ${basin.toLowerCase()}` : 'Curated projects'}
        </span>
      </div>

      {gated ? (
        <div className="lp-presets__gate">
          <span className="lp-presets__gateIcon" aria-hidden="true">◎</span>
          <p>Select a basin to load high-signal starting points (fresh permits, recent spuds, top producers).</p>
        </div>
      ) : loading ? (
        <div className="lp-presets__row">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="lp-preset lp-preset--skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : (
        <div className="lp-presets__row">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApply(preset)}
              className={`lp-preset lp-preset--${preset.accent}`}
            >
              <span className="lp-preset__metric">{preset.metric_label}</span>
              <span className="lp-preset__title">{preset.title}</span>
              <span className="lp-preset__subtitle">{preset.subtitle}</span>
              <span className="lp-preset__count">
                {preset.est_count != null ? `~${formatCount(preset.est_count)} wells` : 'Estimate pending'}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default PresetCarousel;
