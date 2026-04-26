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
    if (status === 'COMPLETE') return 'border-theme-warning/60 bg-black/20 text-white';
    if (status === 'ACTIVE') return 'border-theme-cyan bg-black/35 text-white';
    if (status === 'STALE') return 'border-theme-warning/70 bg-black/25 text-white';
    return 'border-black/25 bg-black/10 text-white/75';
  }

  if (status === 'COMPLETE') return 'border-theme-cyan/45 bg-theme-bg/85 text-theme-text';
  if (status === 'ACTIVE') return 'border-theme-cyan bg-theme-surface2/70 text-theme-text';
  if (status === 'STALE') return 'border-theme-warning/70 bg-theme-bg/85 text-theme-text';
  return 'border-theme-border bg-theme-bg/70 text-theme-muted';
};

const caption = (status: StepStatus): string => {
  if (status === 'COMPLETE') return 'ready';
  if (status === 'ACTIVE') return 'active';
  if (status === 'STALE') return 'review';
  return 'needs input';
};

const dotTone = (status: StepStatus) => {
  if (status === 'COMPLETE') return 'bg-theme-cyan';
  if (status === 'ACTIVE') return 'bg-theme-warning';
  if (status === 'STALE') return 'bg-theme-warning';
  return 'bg-theme-muted/45';
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
        <div className="flex items-center justify-between gap-3">
          <h2
            className={
              isClassic
                ? 'text-xs font-black uppercase tracking-[0.24em] text-white heading-font'
                : 'text-xs font-black uppercase tracking-[0.24em] text-theme-cyan heading-font'
            }
          >
            {title}
          </h2>
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-theme-muted">
            {steps.find((step) => step.status === 'ACTIVE')?.label ?? 'Review'}
          </span>
        </div>
      </div>
      <div className="p-2">
        <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-4 gap-2'}`}>
          {steps.map((step, idx) => (
            <motion.button
              key={step.id}
              type="button"
              onClick={() => onStepSelect?.(step.id)}
              disabled={!onStepSelect}
              className={`rounded-inner border px-3 py-2 text-left min-h-[50px] ${statusTone(step.status, isClassic)} transition-colors focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
                onStepSelect ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'
              }`}
              initial={{ scale: step.status === 'ACTIVE' ? 0.97 : 1 }}
              animate={{ scale: 1 }}
              transition={SPRING.snappy}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] heading-font">{idx + 1}. {step.label}</p>
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotTone(step.status)}`} />
              </div>
              <p className={`mt-1 text-[9px] font-black uppercase tracking-[0.14em] ${step.status === 'ACTIVE' ? 'text-theme-warning' : 'text-theme-muted'}`}>
                {caption(step.status)}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowStepper;
