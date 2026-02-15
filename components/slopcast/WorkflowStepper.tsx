import React from 'react';

export type DesignStep = 'SETUP' | 'SELECT' | 'RUN' | 'REVIEW';
export type StepStatus = 'NOT_STARTED' | 'ACTIVE' | 'COMPLETE' | 'STALE';

export interface WorkflowStep {
  id: DesignStep;
  label: string;
  status: StepStatus;
}

export interface WorkflowStepperProps {
  isClassic: boolean;
  steps: WorkflowStep[];
  compact?: boolean;
}

const statusTone = (status: StepStatus, isClassic: boolean): string => {
  if (isClassic) {
    if (status === 'COMPLETE') return 'bg-theme-warning text-black border-black/20';
    if (status === 'ACTIVE') return 'bg-theme-cyan text-white border-black/25';
    if (status === 'STALE') return 'bg-theme-magenta text-white border-black/25';
    return 'bg-black/15 text-white/75 border-black/25';
  }

  if (status === 'COMPLETE') return 'bg-theme-cyan text-theme-bg border-theme-cyan';
  if (status === 'ACTIVE') return 'bg-theme-magenta text-white border-theme-magenta';
  if (status === 'STALE') return 'bg-theme-warning text-theme-bg border-theme-warning';
  return 'bg-theme-bg text-theme-muted border-theme-border';
};

const caption = (status: StepStatus): string => {
  if (status === 'COMPLETE') return 'done';
  if (status === 'ACTIVE') return 'active';
  if (status === 'STALE') return 'needs rerun';
  return 'pending';
};

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ isClassic, steps, compact = false }) => {
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
              ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white'
              : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'
          }
        >
          Workflow
        </h2>
      </div>
      <div className="p-3">
        <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-4 gap-2'}`}>
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`rounded-inner border px-3 py-2 ${statusTone(step.status, isClassic)} transition-colors`}
            >
              <p className="text-[9px] font-black uppercase tracking-[0.18em]">{idx + 1}. {step.label}</p>
              <p className={`text-[9px] uppercase tracking-[0.12em] mt-1 ${isClassic ? 'opacity-90' : ''}`}>{caption(step.status)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowStepper;
