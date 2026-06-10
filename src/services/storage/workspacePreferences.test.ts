import { afterEach, describe, expect, it } from 'vitest';
import {
  ECONOMICS_MODULE_KEY,
  ECONOMICS_RESULTS_TAB_KEY,
  getEconomicsModule,
  setEconomicsModule,
  getPanelCollapsed,
  setPanelCollapsed,
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

describe('panel collapse preferences', () => {
  it('returns null when not yet stored', () => {
    expect(getPanelCollapsed('groups')).toBeNull();
    expect(getPanelCollapsed('inspector')).toBeNull();
  });

  it('persists true for groups', () => {
    setPanelCollapsed('groups', true);
    expect(getPanelCollapsed('groups')).toBe(true);
  });

  it('persists false for groups', () => {
    setPanelCollapsed('groups', false);
    expect(getPanelCollapsed('groups')).toBe(false);
  });

  it('groups and inspector are independent', () => {
    setPanelCollapsed('groups', true);
    expect(getPanelCollapsed('inspector')).toBeNull();
  });

  it('stores the key as slopcast-panel-groups-collapsed with value "1" for true', () => {
    setPanelCollapsed('groups', true);
    expect(localStorage.getItem('slopcast-panel-groups-collapsed')).toBe('1');
  });

  it('stores the key as slopcast-panel-groups-collapsed with value "0" for false', () => {
    setPanelCollapsed('groups', false);
    expect(localStorage.getItem('slopcast-panel-groups-collapsed')).toBe('0');
  });

  it('stores the inspector key as slopcast-panel-inspector-collapsed with value "0" for false', () => {
    setPanelCollapsed('inspector', false);
    expect(localStorage.getItem('slopcast-panel-inspector-collapsed')).toBe('0');
  });
});
