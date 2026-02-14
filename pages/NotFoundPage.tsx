import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';

const NotFoundPage: React.FC = () => {
  const { themeId } = useTheme();
  const navigate = useNavigate();
  const isClassic = themeId === 'mario';

  return (
    <div className="min-h-screen bg-transparent theme-transition flex items-center justify-center px-4">
      <div className={`w-full max-w-lg rounded-panel border p-8 text-center theme-transition ${isClassic ? 'sc-panel' : 'bg-theme-surface1/70 border-theme-border shadow-card'}`}>
        <p className={`text-[10px] uppercase tracking-[0.3em] mb-4 ${isClassic ? 'text-theme-warning font-black' : 'text-theme-magenta font-black'}`}>
          Route Not Found
        </p>
        <h1 className={`text-4xl mb-3 ${isClassic ? 'text-white font-black uppercase' : 'text-theme-text font-black tracking-tight'}`}>404</h1>
        <p className={isClassic ? 'text-white/85 mb-6' : 'text-theme-muted mb-6'}>
          This page does not exist in the Slopcast hub yet.
        </p>
        <button
          onClick={() => navigate('/')}
          className={
            isClassic
              ? 'px-5 py-3 rounded-md text-[10px] font-black uppercase tracking-widest border-2 border-theme-magenta bg-theme-cyan text-white shadow-card'
              : 'px-5 py-3 rounded-panel text-[10px] font-black uppercase tracking-widest bg-theme-cyan text-theme-bg shadow-glow-cyan'
          }
        >
          Return To Hub
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
