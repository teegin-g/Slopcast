import React, { useEffect, useState, useCallback } from 'react';
import { getOnboardingDone, setOnboardingDone } from '../../services/storage/workspacePreferences';

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
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const titleId = `onboarding-tour-title-${stepIndex}`;
  const descriptionId = `onboarding-tour-description-${stepIndex}`;

  useEffect(() => {
    if (getOnboardingDone()) return;
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const updatePosition = useCallback(() => {
    const step = TOUR_STEPS[stepIndex];
    const el = document.querySelector(`[data-tour-step="${step.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPosition({ top: rect.bottom + 12, left: Math.max(16, rect.left) });
      setTargetRect(rect);
    } else {
      setTargetRect(null);
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
    setOnboardingDone();
  };

  if (!visible) return null;

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/30 pointer-events-auto" onClick={handleDone} />
      {targetRect && (
        <div
          className="absolute rounded-lg border-2 border-theme-cyan shadow-glow-cyan pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}
      <div
        className={`absolute z-10 w-72 pointer-events-auto ${
          isClassic
            ? 'sc-panel overflow-hidden'
            : 'rounded-panel border shadow-card bg-theme-surface1 border-theme-cyan'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        style={{ top: position.top, left: Math.min(position.left, window.innerWidth - 300) }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-black uppercase tracking-[0.18em] ${isClassic ? 'text-theme-warning' : 'text-theme-cyan'}`}>
              Step {stepIndex + 1} of {TOUR_STEPS.length}
            </span>
            <button
              onClick={handleDone}
              className={`text-xs font-bold focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none rounded-sm ${isClassic ? 'text-white/50 hover:text-white' : 'text-theme-muted hover:text-theme-text'}`}
            >
              Skip
            </button>
          </div>
          <h3 id={titleId} className={`text-sm font-black mb-1 ${isClassic ? 'text-white' : 'text-theme-text'}`}>{step.title}</h3>
          <p id={descriptionId} className={`text-[11px] leading-relaxed mb-3 ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>{step.description}</p>
          <button
            onClick={handleNext}
            className={`w-full py-2 rounded-inner text-xs font-black uppercase tracking-[0.14em] transition-colors focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
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
