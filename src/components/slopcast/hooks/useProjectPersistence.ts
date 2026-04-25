import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  DealMetrics,
  Scenario,
  Well,
  WellGroup,
} from '../../../types';
import type { DesignWorkspace } from '../DesignWorkspaceTabs';
import type { EconomicsModule } from '../economics/types';
import type { AssetWorkflowId, Phase1StageId, Phase1WorkflowId } from '../workflowModel';
import { isEconomicsModule } from '../../../services/storage/workspacePreferences';
import {
  getProject,
  listProjects,
  runEconomics,
  saveProject,
  type RunEconomicsPayload,
  type SaveProjectPayload,
} from '../../../services/projectRepository';

const MIGRATION_KEY = 'slopcast-supabase-v1-migrated';

const buildHash = (value: string): string => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return `h-${(hash >>> 0).toString(16)}`;
};

const sameIdMap = (map: Record<string, string>) => Object.keys(map).every((key) => key === map[key]);

const toStoredFilterArray = (values: Set<string>): string[] => [...values];

const toFilterSet = (value: string | string[] | undefined): Set<string> => {
  if (typeof value === 'string') {
    return value === 'ALL' ? new Set() : new Set([value]);
  }
  if (Array.isArray(value)) {
    return new Set(value.filter((entry): entry is string => typeof entry === 'string'));
  }
  return new Set();
};

interface PersistenceUiState {
  designWorkspace: DesignWorkspace;
  economicsModule: EconomicsModule;
  activeWorkflow: Phase1WorkflowId;
  workflowStages: Record<AssetWorkflowId, Phase1StageId>;
  activeScenarioId: string;
  operatorFilter: Set<string>;
  formationFilter: Set<string>;
  statusFilter: Set<string>;
}

interface UseProjectPersistenceArgs {
  enabled: boolean;
  projectName: string;
  groups: WellGroup[];
  scenarios: Scenario[];
  activeGroupId: string;
  uiState: PersistenceUiState;
  setGroups: Dispatch<SetStateAction<WellGroup[]>>;
  setScenarios: Dispatch<SetStateAction<Scenario[]>>;
  setActiveGroupId: Dispatch<SetStateAction<string>>;
  setDesignWorkspace: Dispatch<SetStateAction<DesignWorkspace>>;
  setEconomicsModule: Dispatch<SetStateAction<EconomicsModule>>;
  setActiveWorkflow: Dispatch<SetStateAction<Phase1WorkflowId>>;
  setWorkflowStages: Dispatch<SetStateAction<Record<AssetWorkflowId, Phase1StageId>>>;
  setActiveScenarioId: Dispatch<SetStateAction<string>>;
  setOperatorFilter: Dispatch<SetStateAction<Set<string>>>;
  setFormationFilter: Dispatch<SetStateAction<Set<string>>>;
  setStatusFilter: Dispatch<SetStateAction<Set<string>>>;
  onStatusMessage?: (message: string) => void;
}

interface UseProjectPersistenceResult {
  projectId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  runEconomicsSnapshot: (
    aggregateMetrics: DealMetrics,
    scenarioRankings: Array<{
      id: string;
      npv10: number;
      totalCapex: number;
      eur: number;
      roi: number;
      payoutMonths: number;
      wellCount: number;
    }>,
    warnings: string[]
  ) => Promise<void>;
}

export function useProjectPersistence({
  enabled,
  projectName,
  groups,
  scenarios,
  activeGroupId,
  uiState,
  setGroups,
  setScenarios,
  setActiveGroupId,
  setDesignWorkspace,
  setEconomicsModule,
  setActiveWorkflow,
  setWorkflowStages,
  setActiveScenarioId,
  setOperatorFilter,
  setFormationFilter,
  setStatusFilter,
  onStatusMessage,
}: UseProjectPersistenceArgs): UseProjectPersistenceResult {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHydratingRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const saveQueuedRef = useRef(false);

  const snapshot = useMemo(
    () => ({
      groups,
      scenarios,
      activeGroupId,
      uiState,
    }),
    [groups, scenarios, activeGroupId, uiState]
  );

  const buildPayload = useCallback(
    (nextProjectId: string | null): SaveProjectPayload => ({
      projectId: nextProjectId,
      name: projectName,
      description: null,
      activeGroupId: snapshot.activeGroupId,
      uiState: {
        designWorkspace: snapshot.uiState.designWorkspace,
        economicsModule: snapshot.uiState.economicsModule,
        activeWorkflow: snapshot.uiState.activeWorkflow,
        workflowStages: snapshot.uiState.workflowStages,
        activeScenarioId: snapshot.uiState.activeScenarioId,
        operatorFilter: toStoredFilterArray(snapshot.uiState.operatorFilter),
        formationFilter: toStoredFilterArray(snapshot.uiState.formationFilter),
        statusFilter: toStoredFilterArray(snapshot.uiState.statusFilter),
      },
      groups: snapshot.groups.map((group, index) => ({
        id: group.id,
        name: group.name,
        color: group.color,
        sortOrder: index,
        wellExternalKeys: Array.from(group.wellIds),
        typeCurve: group.typeCurve,
        capex: group.capex,
        opex: group.opex,
        ownership: group.ownership,
        reserveCategory: group.reserveCategory,
        dataQualityAcknowledged: group.dataQualityAcknowledged,
      })),
      scenarios: snapshot.scenarios.map((scenario, index) => ({
        id: scenario.id,
        name: scenario.name,
        color: scenario.color,
        isBaseCase: scenario.isBaseCase,
        pricing: scenario.pricing,
        schedule: scenario.schedule,
        capexScalar: scenario.capexScalar,
        productionScalar: scenario.productionScalar,
        sortOrder: index,
      })),
    }),
    [projectName, snapshot]
  );

  const reconcileIds = useCallback(
    (groupIdMap: Record<string, string>, scenarioIdMap: Record<string, string>) => {
      const groupsNeedChange = !sameIdMap(groupIdMap);
      const scenariosNeedChange = !sameIdMap(scenarioIdMap);
      if (!groupsNeedChange && !scenariosNeedChange) return;

      isHydratingRef.current = true;
      if (groupsNeedChange) {
        setGroups((prev) =>
          prev.map((group) => ({
            ...group,
            id: groupIdMap[group.id] || group.id,
          }))
        );
        setActiveGroupId((prev) => groupIdMap[prev] || prev);
      }
      if (scenariosNeedChange) {
        setScenarios((prev) =>
          prev.map((scenario) => ({
            ...scenario,
            id: scenarioIdMap[scenario.id] || scenario.id,
          }))
        );
      }
      queueMicrotask(() => {
        isHydratingRef.current = false;
      });
    },
    [setActiveGroupId, setGroups, setScenarios]
  );

  const persist = useCallback(async () => {
    if (!enabled || isHydratingRef.current) return;
    if (saveInFlightRef.current) {
      saveQueuedRef.current = true;
      return;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);
    setError(null);

    try {
      const result = await saveProject(buildPayload(projectId));
      setProjectId(result.projectId);
      reconcileIds(result.groupIdMap, result.scenarioIdMap);
      if (onStatusMessage) onStatusMessage('Project saved to Supabase.');
      try {
        localStorage.setItem(MIGRATION_KEY, '1');
      } catch {
        // no-op
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Supabase save failed.';
      setError(message);
      if (onStatusMessage) onStatusMessage(`Save failed: ${message}`);
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
      if (saveQueuedRef.current) {
        saveQueuedRef.current = false;
        void persist();
      }
    }
  }, [buildPayload, enabled, onStatusMessage, projectId, reconcileIds]);

  useEffect(() => {
    if (!enabled) return;
    if (isHydratingRef.current) return;
    const timeout = window.setTimeout(() => {
      void persist();
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [enabled, persist, snapshot]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        const projects = await listProjects();
        if (!active) return;

        if (projects.length === 0) {
          if (onStatusMessage) onStatusMessage('No Supabase project found. Creating one from current model.');
          await persist();
          return;
        }

        const first = projects[0];
        const bundle = await getProject(first.id);
        if (!active) return;

        isHydratingRef.current = true;
        setProjectId(bundle.project.id);
        setGroups(
          bundle.groups.map((group) => ({
            id: group.id,
            name: group.name,
            color: group.color,
            wellIds: new Set(group.wellIds),
            typeCurve: group.typeCurve,
            capex: group.capex,
            opex: group.opex,
            ownership: group.ownership,
            reserveCategory: group.reserveCategory,
            dataQualityAcknowledged: group.dataQualityAcknowledged,
          }))
        );
        setScenarios(
          bundle.scenarios.map((scenario) => ({
            id: scenario.id,
            name: scenario.name,
            color: scenario.color,
            isBaseCase: scenario.isBaseCase,
            pricing: scenario.pricing,
            schedule: scenario.schedule,
            capexScalar: scenario.capexScalar,
            productionScalar: scenario.productionScalar,
          }))
        );
        if (bundle.project.activeGroupId) {
          setActiveGroupId(bundle.project.activeGroupId);
        }

        const storedUi = bundle.project.uiState || {};
        if (storedUi.activeWorkflow === 'PDP' || storedUi.activeWorkflow === 'UNDEVELOPED' || storedUi.activeWorkflow === 'SCENARIOS') {
          setActiveWorkflow(storedUi.activeWorkflow);
        }
        if (storedUi.workflowStages) {
          setWorkflowStages((prev) => ({
            PDP: storedUi.workflowStages?.PDP ?? prev.PDP,
            UNDEVELOPED: storedUi.workflowStages?.UNDEVELOPED ?? prev.UNDEVELOPED,
          }));
        }
        if (typeof storedUi.activeScenarioId === 'string' && storedUi.activeScenarioId) {
          setActiveScenarioId(storedUi.activeScenarioId);
        }
        if (storedUi.designWorkspace === 'WELLS' || storedUi.designWorkspace === 'ECONOMICS') {
          setDesignWorkspace(storedUi.designWorkspace);
        }
        if (isEconomicsModule(storedUi.economicsModule)) {
          setEconomicsModule(storedUi.economicsModule);
        } else if (storedUi.economicsResultsTab === 'CASH_FLOW') {
          setEconomicsModule('CAPEX');
        } else if (storedUi.economicsResultsTab) {
          setEconomicsModule('PRODUCTION');
        }
        setOperatorFilter(toFilterSet(storedUi.operatorFilter));
        setFormationFilter(toFilterSet(storedUi.formationFilter));
        setStatusFilter(toFilterSet(storedUi.statusFilter));

        queueMicrotask(() => {
          isHydratingRef.current = false;
        });

        if (onStatusMessage) onStatusMessage(`Loaded project: ${bundle.project.name}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load project from Supabase.';
        setError(message);
        if (onStatusMessage) onStatusMessage(`Load failed: ${message}`);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
    // Intentionally only on enable flip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const runEconomicsSnapshot = useCallback(
    async (
      aggregateMetrics: DealMetrics,
      scenarioRankings: Array<{
        id: string;
        npv10: number;
        totalCapex: number;
        eur: number;
        roi: number;
        payoutMonths: number;
        wellCount: number;
      }>,
      warnings: string[]
    ) => {
      if (!enabled) {
        throw new Error('Supabase persistence is disabled.');
      }
      if (!projectId) {
        throw new Error('Project has not been created in Supabase yet.');
      }
      const modelForHash = buildPayload(projectId);

      const runPayload: RunEconomicsPayload = {
        inputHash: buildHash(
          JSON.stringify({
            groups: modelForHash.groups,
            scenarios: modelForHash.scenarios,
            activeGroupId: modelForHash.activeGroupId,
          })
        ),
        portfolioMetrics: {
          npv10: aggregateMetrics.npv10,
          totalCapex: aggregateMetrics.totalCapex,
          eur: aggregateMetrics.eur,
          payoutMonths: aggregateMetrics.payoutMonths,
          wellCount: aggregateMetrics.wellCount,
        },
        warnings,
        groupMetrics: scenarioRankings.map((row, index) => ({
          projectGroupId: row.id,
          rank: index + 1,
          metrics: {
            npv10: row.npv10,
            totalCapex: row.totalCapex,
            eur: row.eur,
            roi: row.roi,
            payoutMonths: row.payoutMonths,
            wellCount: row.wellCount,
          },
        })),
      };

      await runEconomics(projectId, runPayload);
      if (onStatusMessage) onStatusMessage('Economics run snapshot saved to Supabase.');
    },
    [buildPayload, enabled, onStatusMessage, projectId]
  );

  return {
    projectId,
    isLoading,
    isSaving,
    error,
    runEconomicsSnapshot,
  };
}
