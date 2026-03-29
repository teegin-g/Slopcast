import React, { useEffect, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SPRING } from '../../theme/motion';
import AnimatedButton from './AnimatedButton';

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
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const prefersReducedMotion = useReducedMotion();

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
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [stepIndex]);

  useEffect(() => {
    if (!visible) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
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
  const maxLeft = typeof window === 'undefined' ? position.left : Math.min(position.left, window.innerWidth - 300);
  const panelMotion = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 12, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 } };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/30 pointer-events-auto" onClick={handleDone} />
      {targetRect && (
        <motion.div
          className="pointer-events-none absolute rounded-panel border-2 border-theme-cyan shadow-glow-cyan"
          initial={false}
          animate={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
          transition={prefersReducedMotion ? { duration: 0 } : SPRING.gentle}
        />
      )}
      <motion.div
        key={step.target}
        initial={panelMotion.initial}
        animate={panelMotion.animate}
        transition={prefersReducedMotion ? { duration: 0 } : SPRING.gentle}
        className={`absolute z-10 w-72 pointer-events-auto ${
          isClassic
            ? 'sc-panel overflow-hidden'
            : 'rounded-panel border border-theme-cyan bg-theme-surface1 shadow-card backdrop-blur-sm'
        }`}
        style={{ top: position.top, left: maxLeft }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-tour-title"
        aria-describedby="onboarding-tour-description"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`heading-font text-xs font-black uppercase tracking-[0.18em] ${isClassic ? 'text-theme-warning' : 'text-theme-cyan'}`}>
              Step {stepIndex + 1} of {TOUR_STEPS.length}
            </span>
            <AnimatedButton
              onClick={handleDone}
              isClassic={isClassic}
              variant="ghost"
              size="sm"
              className="min-h-8 px-2 py-1"
            >
              Skip
            </AnimatedButton>
          </div>
          <h3 id="onboarding-tour-title" className={`heading-font mb-1 text-sm font-black ${isClassic ? 'text-white' : 'text-theme-text'}`}>{step.title}</h3>
          <p id="onboarding-tour-description" className={`mb-3 text-[11px] leading-relaxed ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>{step.description}</p>
          <AnimatedButton
            onClick={handleNext}
            isClassic={isClassic}
            variant="primary"
            size="md"
            className="w-full justify-center"
          >
            {isLast ? 'Done' : 'Next'}
          </AnimatedButton>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingTour;
export { STORAGE_KEY as ONBOARDING_STORAGE_KEY };
