import React from 'react';
import {
  EngineId,
  getStoredEngineId,
  setStoredEngineId,
  getAllEngines,
} from '../../services/economicsEngine';

interface EngineToggleProps {
  isClassic: boolean;
  currentEngineId: EngineId;
  onChange: (id: EngineId) => void;
}

const ENGINE_SHORT: Record<EngineId, string> = {
  typescript: 'TS',
  python: 'PY',
};

const EngineToggle: React.FC<EngineToggleProps> = ({ isClassic, currentEngineId, onChange }) => {
  const engines = getAllEngines();

  const handleSelect = (id: EngineId) => {
    if (id === currentEngineId) return;
    setStoredEngineId(id);
    onChange(id);
  };

  const activeLabel = engines.find(e => e.id === currentEngineId)?.label ?? currentEngineId;

  return (
    <div className="flex items-center gap-1.5" title={`Engine: ${activeLabel}`}>
      <span
        className={`text-[10px] font-semibold uppercase tracking-wide ${
          isClassic ? 'text-white/50' : 'text-theme-text/40'
        }`}
      >
        Engine
      </span>

      <div
        className={`inline-flex rounded-full p-0.5 ${
          isClassic ? 'bg-black/25 border border-black/30' : 'bg-theme-bg border border-theme-border'
        }`}
      >
        {engines.map(engine => {
          const active = engine.id === currentEngineId;
          return (
            <button
              key={engine.id}
              onClick={() => handleSelect(engine.id)}
              title={engine.label}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all duration-150 ${
                active
                  ? isClassic
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'bg-theme-cyan/20 text-theme-cyan shadow-sm'
                  : isClassic
                    ? 'text-white/40 hover:text-white/70'
                    : 'text-theme-text/30 hover:text-theme-text/60'
              }`}
            >
              {ENGINE_SHORT[engine.id]}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EngineToggle;
