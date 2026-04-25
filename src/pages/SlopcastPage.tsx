import React, { Suspense } from 'react';
import ScenarioDashboard from '../components/ScenarioDashboard';
import DesignEconomicsView from '../components/slopcast/DesignEconomicsView';
import DesignWellsView from '../components/slopcast/DesignWellsView';
import { MapCommandCenter } from '../components/slopcast/MapCommandCenter';
import PageHeader from '../components/slopcast/PageHeader';
import WorkflowStepper from '../components/slopcast/WorkflowStepper';
import { isAssetWorkflow, type AssetWorkflowId, type Phase1StageId, type Phase1WorkflowId } from '../components/slopcast/workflowModel';
import { useSlopcastWorkspace } from '../hooks/useSlopcastWorkspace';

interface Phase1MockStageSurfaceProps {
  workflow: Phase1WorkflowId;
  stage: Phase1StageId | null;
  isClassic: boolean;
  groupCount: number;
  wellCount: number;
  activeScenarioName: string;
  onSelectStage: (workflow: AssetWorkflowId, stage: Phase1StageId) => void;
}

const stageCopy: Record<Phase1StageId, { eyebrow: string; title: string; body: string; cards: string[]; next?: Phase1StageId }> = {
  UNIVERSE: {
    eyebrow: 'Phase 1 mock surface',
    title: 'Define the working universe',
    body: 'This prototype reserves the first step for basin, operator, formation, data coverage, and saved universe presets before users enter the map.',
    cards: ['Forecast source coverage', 'Data quality warnings', 'Saved universe presets'],
    next: 'WELLS_INVENTORY',
  },
  WELLS_INVENTORY: {
    eyebrow: 'Existing surface',
    title: 'Select wells and inventory',
    body: 'This stage routes into the current map and group-building experience so the mockup stays functional.',
    cards: ['Map selection', 'Group creation', 'Inventory comparison'],
    next: 'FORECAST_ECONOMICS',
  },
  FORECAST_ECONOMICS: {
    eyebrow: 'Existing surface',
    title: 'Forecast and economics setup',
    body: 'This stage routes into the current economics workspace while the longer-term PDP and undeveloped modules are still being designed.',
    cards: ['Forecast source', 'OPEX and ownership', 'Scenario pricing'],
    next: 'REVIEW',
  },
  REVIEW: {
    eyebrow: 'Phase 1 mock surface',
    title: 'Review scenario readiness',
    body: 'This prototype gives the review step a home for checklist status, risk flags, and handoff into global scenarios.',
    cards: ['Readiness checklist', 'Risk flags', 'Scenario handoff'],
  },
};

const workflowLabel = (workflow: Phase1WorkflowId) => {
  if (workflow === 'UNDEVELOPED') return 'Undeveloped';
  return workflow;
};

const Phase1MockStageSurface: React.FC<Phase1MockStageSurfaceProps> = ({
  workflow,
  stage,
  isClassic,
  groupCount,
  wellCount,
  activeScenarioName,
  onSelectStage,
}) => {
  const safeStage = stage ?? 'UNIVERSE';
  const copy = stageCopy[safeStage];
  const isPdp = workflow === 'PDP';

  return (
    <section className={isClassic ? 'sc-panel theme-transition overflow-hidden' : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/75 border-theme-border overflow-hidden'}>
      <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-5 py-4' : 'border-b border-theme-border/60 px-5 py-4'}>
        <p className={`text-[9px] font-black uppercase tracking-[0.24em] ${isClassic ? 'text-theme-warning' : 'text-theme-magenta'}`}>
          {copy.eyebrow}
        </p>
        <h2 className={`mt-2 text-2xl md:text-4xl font-black tracking-tight ${isClassic ? 'text-white heading-font' : 'text-theme-text heading-font'}`}>
          {workflowLabel(workflow)} / {copy.title}
        </h2>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className={`rounded-inner border p-5 ${isClassic ? 'border-black/25 bg-black/15 text-white/85' : 'border-theme-border/60 bg-theme-bg/45 text-theme-muted'}`}>
          <p className="max-w-3xl text-sm leading-7">{copy.body}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {copy.cards.map(card => (
              <div key={card} className={`rounded-inner border p-4 ${isClassic ? 'border-black/20 bg-black/10' : 'border-theme-border/50 bg-theme-surface2/35'}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${isClassic ? 'text-theme-warning' : 'text-theme-cyan'}`}>{card}</p>
                <p className="mt-3 text-xs leading-5 opacity-75">
                  {isPdp ? 'PDP-specific controls land here in a later phase.' : 'Inventory-specific controls land here in a later phase.'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className={`rounded-inner border p-5 ${isClassic ? 'border-black/25 bg-black/20' : 'border-theme-border/60 bg-theme-surface2/45'}`}>
          <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${isClassic ? 'text-theme-warning' : 'text-theme-lavender'}`}>Context Strip</p>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-theme-muted">Active scenario</span>
              <span className="font-black uppercase text-theme-text">{activeScenarioName}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-theme-muted">Groups</span>
              <span className="font-black text-theme-text">{groupCount}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-theme-muted">{isPdp ? 'Producing wells' : 'Inventory wells'}</span>
              <span className="font-black text-theme-text">{wellCount}</span>
            </div>
          </div>
          {copy.next && isAssetWorkflow(workflow) && (
            <button
              type="button"
              onClick={() => onSelectStage(workflow, copy.next)}
              className={`mt-6 min-h-[44px] w-full rounded-inner px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
                isClassic ? 'bg-theme-warning text-black shadow-card' : 'bg-theme-cyan text-theme-bg shadow-glow-cyan'
              }`}
            >
              Continue to {stageCopy[copy.next].title}
            </button>
          )}
        </aside>
      </div>
    </section>
  );
};

const SlopcastPage: React.FC = () => {
  const ws = useSlopcastWorkspace();
  const activeAssetWorkflow = isAssetWorkflow(ws.activeWorkflow) ? ws.activeWorkflow : null;

  const stageStepper = activeAssetWorkflow ? (
    <WorkflowStepper
      isClassic={ws.isClassic}
      steps={ws.phase1WorkflowSteps}
      title={`${workflowLabel(activeAssetWorkflow)} Workflow`}
      onStepSelect={(stageId) => ws.setWorkflowStage(activeAssetWorkflow, stageId as Phase1StageId)}
    />
  ) : null;

  const wellsSurface = ws.viewportLayout === 'mobile' ? (
    <div className="mx-auto w-full max-w-[1920px] px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 sm:px-4">
      {stageStepper}
      <DesignWellsView
        isClassic={ws.isClassic}
        theme={ws.theme}
        themeId={ws.themeId}
        viewportLayout={ws.viewportLayout}
        mobilePanel={ws.wellsMobilePanel}
        onSetMobilePanel={ws.setWellsMobilePanel}
        groups={ws.processedGroups}
        activeGroupId={ws.activeGroupId}
        selectedWellCount={ws.selectedVisibleCount}
        onActivateGroup={ws.setActiveGroupId}
        onAddGroup={ws.handleAddGroup}
        onCloneGroup={ws.handleCloneGroup}
        onAssignWells={ws.handleAssignWellsToActive}
        onCreateGroupFromSelection={ws.handleCreateGroupFromSelection}
        onSelectAll={ws.handleSelectAll}
        onClearSelection={ws.handleClearSelection}
        operatorFilter={ws.operatorFilter}
        formationFilter={ws.formationFilter}
        statusFilter={ws.statusFilter}
        operatorOptions={ws.operatorOptions}
        formationOptions={ws.formationOptions}
        statusOptions={ws.statusOptions}
        onToggleOperator={ws.toggleOperator}
        onToggleFormation={ws.toggleFormation}
        onToggleStatus={ws.toggleStatus}
        onResetFilters={ws.handleResetFilters}
        filteredWellsCount={ws.filteredWells.length}
        totalWellCount={ws.wells.length}
        wells={ws.wells}
        selectedWellIds={ws.selectedWellIds}
        visibleWellIds={ws.visibleWellIds}
        dimmedWellIds={ws.dimmedWellIds}
        onToggleWell={ws.handleToggleWell}
        onSelectWells={ws.handleSelectWells}
      />
    </div>
  ) : (
    <>
      <div className="mx-auto w-full max-w-[1920px] p-4 md:p-6">
        {stageStepper}
      </div>
      <MapCommandCenter
        isClassic={ws.isClassic}
        theme={ws.theme}
        themeId={ws.themeId}
        viewportLayout={ws.viewportLayout}
        mobilePanel={ws.wellsMobilePanel}
        onSetMobilePanel={ws.setWellsMobilePanel}
        groups={ws.processedGroups}
        activeGroupId={ws.activeGroupId}
        selectedWellCount={ws.selectedVisibleCount}
        onActivateGroup={ws.setActiveGroupId}
        onAddGroup={ws.handleAddGroup}
        onCloneGroup={ws.handleCloneGroup}
        onAssignWells={ws.handleAssignWellsToActive}
        onCreateGroupFromSelection={ws.handleCreateGroupFromSelection}
        onSelectAll={ws.handleSelectAll}
        onClearSelection={ws.handleClearSelection}
        operatorFilter={ws.operatorFilter}
        formationFilter={ws.formationFilter}
        statusFilter={ws.statusFilter}
        operatorOptions={ws.operatorOptions}
        formationOptions={ws.formationOptions}
        statusOptions={ws.statusOptions}
        onToggleOperator={ws.toggleOperator}
        onToggleFormation={ws.toggleFormation}
        onToggleStatus={ws.toggleStatus}
        onResetFilters={ws.handleResetFilters}
        filteredWellsCount={ws.filteredWells.length}
        totalWellCount={ws.wells.length}
        wells={ws.wells}
        selectedWellIds={ws.selectedWellIds}
        visibleWellIds={ws.visibleWellIds}
        dimmedWellIds={ws.dimmedWellIds}
        onToggleWell={ws.handleToggleWell}
        onSelectWells={ws.handleSelectWells}
        dataSourceId={ws.spatialSourceId}
        onSourceChange={ws.handleSourceChange}
        onWellsLoaded={ws.handleWellsLoaded}
      />
    </>
  );

  return (
    <div className={`min-h-screen bg-transparent theme-transition ${ws.atmosphereClass} ${ws.fxClass}`}>
      {ws.BackgroundComponent && (
        <div className="pointer-events-none">
          <Suspense fallback={null}>
            <ws.BackgroundComponent />
          </Suspense>
        </div>
      )}
      {ws.pageOverlayClasses.map(cls => (
        <div key={cls} className={cls} />
      ))}

      <PageHeader
        isClassic={ws.isClassic}
        theme={ws.theme}
        themes={ws.themes}
        themeId={ws.themeId}
        setThemeId={ws.setThemeId}
        activeWorkflow={ws.activeWorkflow}
        onSetActiveWorkflow={ws.setActiveWorkflow}
        activeStageLabel={ws.activeStageLabel}
        activeScenarioName={ws.activeScenario?.name ?? 'Base Case'}
        assetContextLabel={ws.assetContextLabel}
        onNavigateHub={() => ws.navigate('/hub')}
        atmosphericOverlays={ws.atmosphericOverlays}
        headerAtmosphereClass={ws.headerAtmosphereClass}
        fxClass={ws.fxClass}
      />

      <main className={ws.activeWorkflowSurface === 'WELLS' && ws.viewportLayout !== 'mobile' ? 'relative flex-1' : 'p-4 md:p-6 max-w-[1920px] mx-auto w-full'}>

        {ws.activeWorkflowSurface === 'SCENARIOS' ? (
          <ScenarioDashboard
            groups={ws.processedGroups}
            wells={ws.wells}
            scenarios={ws.scenarios}
            setScenarios={ws.handleSetScenarios}
            activeScenarioId={ws.activeScenarioId}
            onSetActiveScenarioId={ws.setActiveScenarioId}
          />
        ) : ws.activeWorkflowSurface === 'WELLS' ? (
          wellsSurface
        ) : ws.activeWorkflowSurface === 'ECONOMICS' ? (
          <>
            {stageStepper}
            <DesignEconomicsView
              isClassic={ws.isClassic}
              themeId={ws.themeId}
              mobilePanel={ws.economicsMobilePanel}
              onSetMobilePanel={ws.setEconomicsMobilePanel}
              economicsModule={ws.economicsModule}
              onSetEconomicsModule={ws.setEconomicsModule}
              wells={ws.wells}
              groups={ws.processedGroups}
              activeGroupId={ws.activeGroupId}
              onActivateGroup={ws.setActiveGroupId}
              onCloneGroup={ws.handleCloneGroup}
              activeGroup={ws.activeGroup}
              onUpdateGroup={ws.handleUpdateGroup}
              onMarkDirty={() => {}}
              scenarios={ws.scenarios}
              activeScenarioId={ws.activeScenarioId}
              onSetActiveScenarioId={ws.setActiveScenarioId}
              aggregateMetrics={ws.aggregateMetrics}
              aggregateFlow={ws.aggregateFlow}
              operationsProps={ws.operationsProps}
              breakevenOilPrice={ws.breakevenOilPrice}
            />
          </>
        ) : (
          <>
            {stageStepper}
            <Phase1MockStageSurface
              workflow={ws.activeWorkflow}
              stage={ws.activeWorkflowStage}
              isClassic={ws.isClassic}
              groupCount={ws.processedGroups.length}
              wellCount={ws.aggregateMetrics.wellCount}
              activeScenarioName={ws.activeScenario?.name ?? 'Base Case'}
              onSelectStage={ws.setWorkflowStage}
            />
          </>
        )}

      </main>
    </div>
  );
};

export default SlopcastPage;
