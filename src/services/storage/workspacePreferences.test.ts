import { afterEach, describe, expect, it } from 'vitest';
import {
  ECONOMICS_MODULE_KEY,
  ECONOMICS_RESULTS_TAB_KEY,
  getEconomicsModule,
  setEconomicsModule,
} from './workspacePreferences';

afterEach(() => {
  localStorage.clear();
});

describe('economics module workspace preferences', () => {
  it('persists explicit economics module selection', () => {
    setEconomicsModule('OWNERSHIP');
    expect(getEconomicsModule()).toBe('OWNERSHIP');
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
