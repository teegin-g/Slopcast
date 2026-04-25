import { describe, expect, it } from 'vitest';
import {
  getWorkflowStageSurface,
  isAssetWorkflow,
  phase1WorkflowStages,
  type Phase1StageId,
  type Phase1WorkflowId,
} from './workflowModel';

describe('Phase 1 workflow model', () => {
  it('defines the shared PDP and undeveloped stage grammar', () => {
    const expectedStages: Phase1StageId[] = ['UNIVERSE', 'WELLS_INVENTORY', 'FORECAST_ECONOMICS', 'REVIEW'];

    expect(phase1WorkflowStages.PDP.map(stage => stage.id)).toEqual(expectedStages);
    expect(phase1WorkflowStages.UNDEVELOPED.map(stage => stage.id)).toEqual(expectedStages);
  });

  it('routes workflow stages onto existing or mock surfaces', () => {
    expect(getWorkflowStageSurface('PDP', 'UNIVERSE')).toBe('MOCK');
    expect(getWorkflowStageSurface('PDP', 'WELLS_INVENTORY')).toBe('WELLS');
    expect(getWorkflowStageSurface('UNDEVELOPED', 'FORECAST_ECONOMICS')).toBe('ECONOMICS');
    expect(getWorkflowStageSurface('UNDEVELOPED', 'REVIEW')).toBe('MOCK');
  });

  it('keeps scenarios outside PDP and undeveloped stage navigation', () => {
    const workflows: Phase1WorkflowId[] = ['PDP', 'UNDEVELOPED', 'SCENARIOS'];

    expect(workflows.filter(isAssetWorkflow)).toEqual(['PDP', 'UNDEVELOPED']);
    expect(isAssetWorkflow('SCENARIOS')).toBe(false);
  });
});
