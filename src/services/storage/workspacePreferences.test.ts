import { afterEach, describe, expect, it } from 'vitest';
import {
  ACTIVE_SCENARIO_KEY,
  ACTIVE_WORKFLOW_KEY,
  ECONOMICS_MODULE_KEY,
  ECONOMICS_RESULTS_TAB_KEY,
  WORKFLOW_STAGES_KEY,
  getActiveScenarioId,
  getActiveWorkflow,
  getEconomicsModule,
  getWorkflowStages,
  setActiveScenarioId,
  setActiveWorkflow,
  setEconomicsModule,
  setWorkflowStages,
} from './workspacePreferences';

afterEach(() => {
  localStorage.clear();
});

describe('economics module workspace preferences', () => {
  it('persists explicit economics module selection', () => {
    setEconomicsModule('OWNERSHIP');
    expect(getEconomicsModule()).toBe('OWNERSHIP');
  });

  it('persists workflow-specific economics modules', () => {
    setEconomicsModule('SPACING');
    expect(getEconomicsModule()).toBe('SPACING');

    setEconomicsModule('RISK');
    expect(getEconomicsModule()).toBe('RISK');
  });

  it('migrates legacy cash-flow tab to CAPEX module', () => {
    localStorage.setItem(ECONOMICS_RESULTS_TAB_KEY, 'CASH_FLOW');
    expect(getEconomicsModule()).toBe('CAPEX');
    expect(localStorage.getItem(ECONOMICS_MODULE_KEY)).toBe('CAPEX');
  });

  it('defaults legacy overview tab to production module', () => {
    localStorage.setItem(ECONOMICS_RESULTS_TAB_KEY, 'OVERVIEW');
    expect(getEconomicsModule()).toBe('PRODUCTION');
  });
});

describe('phase 1 workflow workspace preferences', () => {
  it('persists active workflow, stage map, and scenario id', () => {
    setActiveWorkflow('SCENARIOS');
    setWorkflowStages({ PDP: 'FORECAST_ECONOMICS', UNDEVELOPED: 'REVIEW' });
    setActiveScenarioId('s-upside');

    expect(getActiveWorkflow()).toBe('SCENARIOS');
    expect(getWorkflowStages()).toEqual({ PDP: 'FORECAST_ECONOMICS', UNDEVELOPED: 'REVIEW' });
    expect(getActiveScenarioId()).toBe('s-upside');
  });

  it('falls back when stored workflow state is invalid', () => {
    localStorage.setItem(ACTIVE_WORKFLOW_KEY, 'DESIGN');
    localStorage.setItem(WORKFLOW_STAGES_KEY, JSON.stringify({ PDP: 'BAD', UNDEVELOPED: 'WELLS_INVENTORY' }));
    localStorage.setItem(ACTIVE_SCENARIO_KEY, '');

    expect(getActiveWorkflow()).toBe('PDP');
    expect(getWorkflowStages()).toEqual({ PDP: 'UNIVERSE', UNDEVELOPED: 'WELLS_INVENTORY' });
    expect(getActiveScenarioId()).toBe('s-base');
  });
});
