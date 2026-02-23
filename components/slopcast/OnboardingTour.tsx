import React, { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'slopcast-onboarding-done';

interface TourStep {
  target: string; // data-tour-step attribute value
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  { target: 'welcome', title: 'Welcome to Slopcast', description: 'Your oil & gas economics platform. Let\'s take a quick tour of the key features.' },
  { target: 'wells-workspace', title: 'Wells Workspace', description: 'Select and assign wells to groups using the interactive basin map and lasso tools.' },
  { target: 'economics-workspace', title: 'Economics Workspace', description: 'Configure decline curves, CAPEX, OPEX, and ownership to see live NPV calculations.' },
  { target: 'workflow-stepper', title: 'Workflow Progress', description: 'Track your progress through Setup, Well Selection, and Review stages.' },
  { target: 'review-snapshot', title: 'Save & Export', description: 'Save snapshots of your economics runs and export data to CSV when ready.' },
];

interface OnboardingTourProps {
  isClassic: boolean;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isClassic }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 100, left: 100 });

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch { /* ignore */ }
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const updatePosition = useCallback(() => {
    const step = TOUR_STEPS[stepIndex];
    const el = document.querySelector(`[data-tour-step="${step.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPosition({ top: rect.bottom + 12, left: Math.max(16, rect.left) });
    }
  }, [stepIndex]);

  useEffect(() => {
    if (!visible) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [visible, updatePosition]);

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleDone();
    }
  };

  const handleDone = () => {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
  };

  if (!visible) return null;

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      <div className="absolute inset-0 bg-black/30 pointer-events-auto" onClick={handleDone} />
      <div
        className={`absolute z-10 w-72 pointer-events-auto ${
          isClassic
            ? 'sc-panel overflow-hidden'
            : 'rounded-panel border shadow-card bg-theme-surface1 border-theme-cyan'
        }`}
        style={{ top: position.top, left: Math.min(position.left, window.innerWidth - 300) }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[9px] font-black uppercase tracking-[0.18em] ${isClassic ? 'text-theme-warning' : 'text-theme-cyan'}`}>
              Step {stepIndex + 1} of {TOUR_STEPS.length}
            </span>
            <button
              onClick={handleDone}
              className={`text-[9px] font-bold ${isClassic ? 'text-white/50 hover:text-white' : 'text-theme-muted hover:text-theme-text'}`}
            >
              Skip
            </button>
          </div>
          <h3 className={`text-sm font-black mb-1 ${isClassic ? 'text-white' : 'text-theme-text'}`}>{step.title}</h3>
          <p className={`text-[11px] leading-relaxed mb-3 ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>{step.description}</p>
          <button
            onClick={handleNext}
            className={`w-full py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${
              isClassic
                ? 'sc-btnPrimary'
                : 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan'
            }`}
          >
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
export { STORAGE_KEY as ONBOARDING_STORAGE_KEY };
