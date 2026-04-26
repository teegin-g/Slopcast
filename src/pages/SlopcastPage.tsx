import React, { Suspense } from 'react';
import ScenarioDashboard from '../components/ScenarioDashboard';
import DesignEconomicsView from '../components/slopcast/DesignEconomicsView';
import DesignWellsView from '../components/slopcast/DesignWellsView';
import { MapCommandCenter } from '../components/slopcast/MapCommandCenter';
import PageHeader from '../components/slopcast/PageHeader';
import {
  PdpReviewSurface,
  PdpUniverseSurface,
  UndevelopedInventorySurface,
  UndevelopedReviewSurface,
  UndevelopedUniverseSurface,
} from '../components/slopcast/PdpWorkflowSurfaces';
import WorkflowStepper from '../components/slopcast/WorkflowStepper';
import { isAssetWorkflow, type Phase1StageId, type Phase1WorkflowId } from '../components/slopcast/workflowModel';
import { useSlopcastWorkspace } from '../hooks/useSlopcastWorkspace';

const workflowLabel = (workflow: Phase1WorkflowId) => {
  if (workflow === 'UNDEVELOPED') return 'Undeveloped';
  return workflow;
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

      <main className={ws.activeWorkflowSurface === 'WELLS' && ws.activeWorkflow === 'PDP' && ws.viewportLayout !== 'mobile' ? 'relative flex-1' : 'p-4 md:p-6 max-w-[1920px] mx-auto w-full'}>

        {ws.activeWorkflowSurface === 'SCENARIOS' ? (
          <ScenarioDashboard
            groups={ws.processedGroups}
            wells={ws.wells}
            scenarios={ws.scenarios}
            setScenarios={ws.handleSetScenarios}
            activeScenarioId={ws.activeScenarioId}
            onSetActiveScenarioId={ws.setActiveScenarioId}
            developmentSummary={ws.developmentInventorySummary}
          />
        ) : ws.activeWorkflowSurface === 'WELLS' && ws.activeWorkflow === 'UNDEVELOPED' ? (
          <>
            {stageStepper}
            <UndevelopedInventorySurface
              inventory={ws.developmentInventory}
              summary={ws.developmentInventorySummary}
              readiness={ws.undevelopedReadiness}
              onContinue={() => ws.setWorkflowStage('UNDEVELOPED', 'FORECAST_ECONOMICS')}
            />
          </>
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
              activeWorkflow={ws.activeWorkflow}
              developmentSummary={ws.developmentInventorySummary}
              undevelopedReadiness={ws.undevelopedReadiness}
            />
          </>
        ) : (
          <>
            {stageStepper}
            {ws.activeWorkflow === 'PDP' && ws.activeWorkflowStage === 'UNIVERSE' ? (
              <PdpUniverseSurface
                filteredWells={ws.filteredWells}
                totalWellCount={ws.wells.length}
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
                historyByWellId={ws.productionHistoryByWellId}
                summary={ws.pdpUniverseSummary}
                onContinue={() => ws.setWorkflowStage('PDP', 'WELLS_INVENTORY')}
              />
            ) : ws.activeWorkflow === 'PDP' && ws.activeWorkflowStage === 'REVIEW' ? (
              <PdpReviewSurface
                groups={ws.processedGroups}
                summaries={ws.pdpGroupSummaries}
                readiness={ws.pdpReadiness}
                activeScenarioName={ws.activeScenario?.name ?? 'Base Case'}
                onAcknowledge={ws.handleAcknowledgePdpDataQuality}
                onOpenScenarios={() => ws.setActiveWorkflow('SCENARIOS')}
              />
            ) : ws.activeWorkflow === 'UNDEVELOPED' && ws.activeWorkflowStage === 'UNIVERSE' ? (
              <UndevelopedUniverseSurface
                inventory={ws.developmentInventory}
                summary={ws.developmentInventorySummary}
                readiness={ws.undevelopedReadiness}
                onContinue={() => ws.setWorkflowStage('UNDEVELOPED', 'WELLS_INVENTORY')}
              />
            ) : ws.activeWorkflow === 'UNDEVELOPED' && ws.activeWorkflowStage === 'REVIEW' ? (
              <UndevelopedReviewSurface
                inventory={ws.developmentInventory}
                summary={ws.developmentInventorySummary}
                readiness={ws.undevelopedReadiness}
                activeScenarioName={ws.activeScenario?.name ?? 'Base Case'}
                onOpenScenarios={() => ws.setActiveWorkflow('SCENARIOS')}
              />
            ) : (
              <UndevelopedInventorySurface
                inventory={ws.developmentInventory}
                summary={ws.developmentInventorySummary}
                readiness={ws.undevelopedReadiness}
                onContinue={() => ws.setWorkflowStage('UNDEVELOPED', 'FORECAST_ECONOMICS')}
              />
            )}
          </>
        )}

      </main>
    </div>
  );
};

export default SlopcastPage;
