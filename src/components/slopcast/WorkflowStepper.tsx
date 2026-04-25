import React from 'react';
import { motion } from 'motion/react';
import { SPRING } from '../../theme/motion';

export type DesignStep = 'SETUP' | 'SELECT' | 'RUN' | 'REVIEW';
export type StepStatus = 'NOT_STARTED' | 'ACTIVE' | 'COMPLETE' | 'STALE';

export interface WorkflowStep {
  id: string;
  label: string;
  status: StepStatus;
  description?: string;
}

export interface WorkflowStepperProps {
  isClassic: boolean;
  steps: WorkflowStep[];
  compact?: boolean;
  title?: string;
  onStepSelect?: (stepId: string) => void;
}

const statusTone = (status: StepStatus, isClassic: boolean): string => {
  if (isClassic) {
    if (status === 'COMPLETE') return 'bg-theme-warning text-black border-black/20';
    if (status === 'ACTIVE') return 'bg-theme-cyan text-white border-black/25';
    if (status === 'STALE') return 'bg-theme-magenta text-white border-black/25';
    return 'bg-black/15 text-white/75 border-black/25';
  }

  if (status === 'COMPLETE') return 'bg-theme-cyan text-theme-bg border-theme-cyan';
  if (status === 'ACTIVE') return 'bg-theme-magenta text-theme-bg border-theme-magenta';
  if (status === 'STALE') return 'bg-theme-warning text-theme-bg border-theme-warning';
  return 'bg-theme-bg text-theme-muted border-theme-border';
};

const caption = (status: StepStatus): string => {
  if (status === 'COMPLETE') return 'done';
  if (status === 'ACTIVE') return 'active';
  if (status === 'STALE') return 'needs rerun';
  return 'pending';
};

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ isClassic, steps, compact = false, title = 'Workflow', onStepSelect }) => {
  return (
    <div
      className={
        isClassic
          ? `sc-panel theme-transition ${compact ? '' : 'mb-5'}`
          : `rounded-panel border shadow-card theme-transition bg-theme-surface1/80 border-theme-border ${compact ? '' : 'mb-5'}`
      }
    >
      <div
        className={
          isClassic
            ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-2.5'
            : 'px-4 py-2.5 border-b border-theme-border/60'
        }
      >
        <h2
          className={
            isClassic
              ? 'text-xs font-black uppercase tracking-[0.24em] text-white heading-font'
              : 'text-xs font-black uppercase tracking-[0.24em] text-theme-cyan heading-font'
          }
        >
          {title}
        </h2>
      </div>
      <div className="p-3">
        <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2'}`}>
          {steps.map((step, idx) => (
            <motion.button
              key={step.id}
              type="button"
              onClick={() => onStepSelect?.(step.id)}
              disabled={!onStepSelect}
              className={`rounded-inner border px-3 py-2 text-left ${statusTone(step.status, isClassic)} transition-colors focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
                onStepSelect ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'
              }`}
              initial={{ scale: step.status === 'ACTIVE' ? 0.97 : 1 }}
              animate={{ scale: 1 }}
              transition={SPRING.snappy}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] heading-font">{idx + 1}. {step.label}</p>
              <p className={`text-xs uppercase tracking-[0.12em] mt-1 ${isClassic ? 'opacity-90' : ''}`}>{caption(step.status)}</p>
              {step.description && !compact && (
                <p className={`mt-2 text-[11px] normal-case tracking-normal leading-relaxed ${isClassic ? 'text-white/75' : 'text-theme-muted'}`}>
                  {step.description}
                </p>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowStepper;
