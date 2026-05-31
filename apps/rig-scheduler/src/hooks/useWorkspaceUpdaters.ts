import type { Dispatch, SetStateAction } from 'react';
import { createEmptyManualOverrides } from '../engine/scheduler';
import type {
  ForcedAllocation,
  InventoryBucket,
  ManualRigAllocation,
  ManualYearAllocation,
  ScheduleRunRequest,
  ScheduleScenario,
  WorkspaceState,
} from '../types';
import { cloneRequest, colors } from '../shared';

interface UpdaterDeps {
  workspace: WorkspaceState;
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
  rigOptions: string[];
  setJsonDraft: Dispatch<SetStateAction<string>>;
  setJsonError: Dispatch<SetStateAction<string>>;
}

export const useWorkspaceUpdaters = ({
  workspace,
  setWorkspace,
  rigOptions,
  setJsonDraft,
  setJsonError,
}: UpdaterDeps) => {
  const replaceRequest = (request: ScheduleRunRequest, fixtureId = 'custom') => {
    setWorkspace({ fixtureId, request: cloneRequest(request) });
    setJsonDraft(JSON.stringify(request, null, 2));
    setJsonError('');
  };

  const updateScenario = (updater: (scenario: ScheduleScenario) => ScheduleScenario) => {
    setWorkspace((current) => ({
      ...current,
      request: {
        ...current.request,
        scenario: updater(current.request.scenario),
      },
    }));
  };

  const updateInventory = (updater: (inventory: InventoryBucket[]) => InventoryBucket[]) => {
    setWorkspace((current) => ({
      ...current,
      request: {
        ...current.request,
        inventory: updater(current.request.inventory),
      },
    }));
  };

  const updateManualYear = (updater: (rows: ManualYearAllocation[]) => ManualYearAllocation[]) => {
    setWorkspace((current) => ({
      ...current,
      request: {
        ...current.request,
        manualOverrides: {
          ...current.request.manualOverrides,
          annualBucketTargets: updater(current.request.manualOverrides.annualBucketTargets),
        },
      },
    }));
  };

  const updateManualRig = (updater: (rows: ManualRigAllocation[]) => ManualRigAllocation[]) => {
    setWorkspace((current) => ({
      ...current,
      request: {
        ...current.request,
        manualOverrides: {
          ...current.request.manualOverrides,
          perRigTargets: updater(current.request.manualOverrides.perRigTargets),
        },
      },
    }));
  };

  const updateForced = (updater: (rows: ForcedAllocation[]) => ForcedAllocation[]) => {
    setWorkspace((current) => ({
      ...current,
      request: {
        ...current.request,
        manualOverrides: {
          ...current.request.manualOverrides,
          forcedAllocations: updater(current.request.manualOverrides.forcedAllocations),
        },
      },
    }));
  };

  const syncYears = (years: number) => {
    updateScenario((scenario) => {
      const resize = (values: number[], fallback: number) =>
        Array.from({ length: years }, (_, index) => values[index] ?? fallback);

      return {
        ...scenario,
        years,
        annualRigCount: resize(
          scenario.annualRigCount,
          scenario.annualRigCount[scenario.annualRigCount.length - 1] ?? 0,
        ),
        annualCapexBudget: resize(
          scenario.annualCapexBudget,
          scenario.annualCapexBudget[scenario.annualCapexBudget.length - 1] ?? 0,
        ),
      };
    });
  };

  const addInventoryRow = () => {
    updateInventory((inventory) => [
      ...inventory,
      {
        id: `bucket-${Date.now()}`,
        name: `New Bucket ${inventory.length + 1}`,
        inventoryCount: 1,
        npvPerWell: 5_000_000,
        capexPerWell: 3_500_000,
        spudToOnlineDays: 120,
        color: colors[inventory.length % colors.length],
        notes: '',
      },
    ]);
  };

  const addAnnualOverrideRow = () =>
    updateManualYear((rows) => [
      ...rows,
      {
        yearIndex: 0,
        bucketId: workspace.request.inventory[0]?.id ?? '',
        count: 1,
      },
    ]);

  const addRigOverrideRow = () =>
    updateManualRig((rows) => [
      ...rows,
      {
        rigId: rigOptions[0] ?? 'Rig 1',
        yearIndex: 0,
        bucketId: workspace.request.inventory[0]?.id ?? '',
        count: 1,
      },
    ]);

  const addForcedOverrideRow = () =>
    updateForced((rows) => [
      ...rows,
      {
        rigId: rigOptions[0] ?? 'Rig 1',
        yearIndex: 0,
        bucketId: workspace.request.inventory[0]?.id ?? '',
        count: 1,
      },
    ]);

  const clearOverrides = () =>
    setWorkspace((current) => ({
      ...current,
      request: {
        ...current.request,
        manualOverrides: createEmptyManualOverrides(),
      },
    }));

  return {
    replaceRequest,
    updateScenario,
    updateInventory,
    updateManualYear,
    updateManualRig,
    updateForced,
    syncYears,
    addInventoryRow,
    addAnnualOverrideRow,
    addRigOverrideRow,
    addForcedOverrideRow,
    clearOverrides,
  };
};

export type WorkspaceUpdaters = ReturnType<typeof useWorkspaceUpdaters>;
