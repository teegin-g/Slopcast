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
import type { AssetWorkflowId, Phase1StageId, Phase1WorkflowId } from '../../components/slopcast/workflowModel';
import type { EconomicsResultsTab } from '../../components/slopcast/EconomicsResultsTabs';
import type { EconomicsModule } from '../../components/slopcast/economics/types';
import type { FxMode, AnalysisOpenSection } from '../../hooks/useSlopcastWorkspace';
import type { EngineId } from '../economicsEngine';

// ─── Key constants ───────────────────────────────────────────────────────────

export const DESIGN_WORKSPACE_KEY = 'slopcast-design-workspace';
export const ECONOMICS_RESULTS_TAB_KEY = 'slopcast-econ-results-tab';
export const ECONOMICS_MODULE_KEY = 'slopcast-econ-module';
export const ECONOMICS_FOCUS_MODE_KEY = 'slopcast-econ-focus-mode';
export const ACTIVE_WORKFLOW_KEY = 'slopcast-active-workflow';
export const WORKFLOW_STAGES_KEY = 'slopcast-workflow-stages';
export const ACTIVE_SCENARIO_KEY = 'slopcast-active-scenario';
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

const isWorkflow = (value: unknown): value is Phase1WorkflowId =>
  value === 'PDP' || value === 'UNDEVELOPED' || value === 'SCENARIOS';

const isStage = (value: unknown): value is Phase1StageId =>
  value === 'UNIVERSE' || value === 'WELLS_INVENTORY' || value === 'FORECAST_ECONOMICS' || value === 'REVIEW';

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

// ─── Economics module ────────────────────────────────────────────────────────

const legacyTabToModule = (value: string | null): EconomicsModule | null => {
  if (value === 'OVERVIEW' || value === 'SUMMARY' || value === 'CHARTS' || value === 'DRIVERS') return 'PRODUCTION';
  if (value === 'CASH_FLOW') return 'CAPEX';
  if (value === 'RESERVES') return 'PRODUCTION';
  return null;
};

export function isEconomicsModule(value: unknown): value is EconomicsModule {
  return value === 'PRODUCTION'
    || value === 'PRICING'
    || value === 'OPEX'
    || value === 'TAXES'
    || value === 'OWNERSHIP'
    || value === 'CAPEX'
    || value === 'SPACING'
    || value === 'SCHEDULE'
    || value === 'RISK';
}

export function getEconomicsModule(): EconomicsModule {
  const raw = safeGet(ECONOMICS_MODULE_KEY);
  if (isEconomicsModule(raw)) return raw;
  const migrated = legacyTabToModule(safeGet(ECONOMICS_RESULTS_TAB_KEY));
  if (migrated) {
    safeSet(ECONOMICS_MODULE_KEY, migrated);
    return migrated;
  }
  return 'PRODUCTION';
}

export function setEconomicsModule(value: EconomicsModule): void {
  safeSet(ECONOMICS_MODULE_KEY, value);
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

// ─── Phase 1 workflow shell ─────────────────────────────────────────────────

export function getActiveWorkflow(): Phase1WorkflowId {
  const raw = safeGet(ACTIVE_WORKFLOW_KEY);
  return isWorkflow(raw) ? raw : 'PDP';
}

export function setActiveWorkflow(value: Phase1WorkflowId): void {
  safeSet(ACTIVE_WORKFLOW_KEY, value);
}

export function getWorkflowStages(): Record<AssetWorkflowId, Phase1StageId> {
  const fallback: Record<AssetWorkflowId, Phase1StageId> = {
    PDP: 'UNIVERSE',
    UNDEVELOPED: 'UNIVERSE',
  };
  const raw = safeGet(WORKFLOW_STAGES_KEY);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<AssetWorkflowId, unknown>>;
    return {
      PDP: isStage(parsed.PDP) ? parsed.PDP : fallback.PDP,
      UNDEVELOPED: isStage(parsed.UNDEVELOPED) ? parsed.UNDEVELOPED : fallback.UNDEVELOPED,
    };
  } catch {
    return fallback;
  }
}

export function setWorkflowStages(value: Record<AssetWorkflowId, Phase1StageId>): void {
  safeSet(WORKFLOW_STAGES_KEY, JSON.stringify(value));
}

export function getActiveScenarioId(): string {
  return safeGet(ACTIVE_SCENARIO_KEY) || 's-base';
}

export function setActiveScenarioId(value: string): void {
  safeSet(ACTIVE_SCENARIO_KEY, value);
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
