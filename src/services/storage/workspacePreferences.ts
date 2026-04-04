/**
 * Workspace preference storage facade.
 *
 * Centralises all localStorage keys and provides typed read/write helpers
 * with migration logic. Consumers import named getters/setters; nobody
 * should scatter raw localStorage calls across the app.
 *
 * Keys intentionally kept as exported constants for any code (e.g. Supabase
 * persistence) that needs the raw key name.
 */

import type { DesignWorkspace } from '../../components/slopcast/DesignWorkspaceTabs';
import type { EconomicsResultsTab } from '../../components/slopcast/EconomicsResultsTabs';
import type { FxMode, AnalysisOpenSection } from '../../hooks/useSlopcastWorkspace';
import type { EngineId } from '../economicsEngine';

// ─── Key constants ───────────────────────────────────────────────────────────

export const DESIGN_WORKSPACE_KEY = 'slopcast-design-workspace';
export const ECONOMICS_RESULTS_TAB_KEY = 'slopcast-econ-results-tab';
export const ECONOMICS_FOCUS_MODE_KEY = 'slopcast-econ-focus-mode';
export const FX_QUERY_KEY = 'fx';
export const FX_STORAGE_KEY_PREFIX = 'slopcast-fx-';
export const ANALYSIS_OPEN_SECTION_KEY = 'slopcast-analysis-open-section';
export const SIDEBAR_COLLAPSED_KEY = 'slopcast-sidebar-collapsed';
export const ENGINE_ID_KEY = 'slopcast_engine_id';
export const ONBOARDING_KEY = 'slopcast-onboarding-done';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // no-op — private browsing or quota exceeded
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // no-op
  }
}

// ─── Design workspace ────────────────────────────────────────────────────────

export function getDesignWorkspace(): DesignWorkspace {
  const raw = safeGet(DESIGN_WORKSPACE_KEY);
  if (raw === 'WELLS' || raw === 'ECONOMICS') return raw;
  return 'WELLS';
}

export function setDesignWorkspace(value: DesignWorkspace): void {
  safeSet(DESIGN_WORKSPACE_KEY, value);
}

// ─── Economics results tab ───────────────────────────────────────────────────
// Migration: SUMMARY/CHARTS/DRIVERS → OVERVIEW (legacy tab names removed)

export function getEconomicsResultsTab(): EconomicsResultsTab {
  const raw = safeGet(ECONOMICS_RESULTS_TAB_KEY);
  if (raw === 'OVERVIEW' || raw === 'CASH_FLOW' || raw === 'RESERVES') return raw;
  // Migrate legacy tab names
  if (raw === 'SUMMARY' || raw === 'CHARTS' || raw === 'DRIVERS') {
    safeSet(ECONOMICS_RESULTS_TAB_KEY, 'OVERVIEW');
    return 'OVERVIEW';
  }
  return 'OVERVIEW';
}

export function setEconomicsResultsTab(value: EconomicsResultsTab): void {
  safeSet(ECONOMICS_RESULTS_TAB_KEY, value);
}

// ─── Economics focus mode ────────────────────────────────────────────────────

export function getEconomicsFocusMode(): boolean {
  const raw = safeGet(ECONOMICS_FOCUS_MODE_KEY);
  if (raw === '1') return true;
  if (raw === '0') return false;
  return false;
}

export function setEconomicsFocusMode(enabled: boolean): void {
  if (enabled) {
    safeSet(ECONOMICS_FOCUS_MODE_KEY, '1');
  } else {
    safeRemove(ECONOMICS_FOCUS_MODE_KEY);
  }
}

// ─── FX mode (per-theme) ─────────────────────────────────────────────────────

export function getFxMode(themeId: string): FxMode | null {
  const raw = safeGet(`${FX_STORAGE_KEY_PREFIX}${themeId}`);
  if (raw === 'cinematic' || raw === 'max') return raw;
  return null;
}

export function setFxMode(themeId: string, mode: FxMode): void {
  safeSet(`${FX_STORAGE_KEY_PREFIX}${themeId}`, mode);
}

export function clearFxMode(themeId: string): void {
  safeRemove(`${FX_STORAGE_KEY_PREFIX}${themeId}`);
}

// ─── Analysis open section ───────────────────────────────────────────────────

export function getAnalysisOpenSection(): AnalysisOpenSection | null {
  const raw = safeGet(ANALYSIS_OPEN_SECTION_KEY);
  if (raw === 'PRICING' || raw === 'SCHEDULE' || raw === 'SCALARS') return raw;
  return null;
}

export function setAnalysisOpenSection(section: AnalysisOpenSection): void {
  safeSet(ANALYSIS_OPEN_SECTION_KEY, section);
}

// ─── Sidebar collapsed ───────────────────────────────────────────────────────

export function getSidebarCollapsed(): boolean | null {
  const raw = safeGet(SIDEBAR_COLLAPSED_KEY);
  if (raw === '1') return true;
  if (raw === '0') return false;
  return null; // not yet stored — let caller decide default
}

export function setSidebarCollapsed(collapsed: boolean): void {
  safeSet(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
}

// ─── Engine preference ───────────────────────────────────────────────────────

export function getEngineId(): EngineId {
  const stored = safeGet(ENGINE_ID_KEY);
  return stored === 'python' ? 'python' : 'typescript';
}

export function setEngineId(id: EngineId): void {
  safeSet(ENGINE_ID_KEY, id);
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export function getOnboardingDone(): boolean {
  return safeGet(ONBOARDING_KEY) === '1';
}

export function setOnboardingDone(): void {
  safeSet(ONBOARDING_KEY, '1');
}
