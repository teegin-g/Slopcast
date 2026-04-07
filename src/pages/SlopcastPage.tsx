import React, { Suspense } from 'react';
import ScenarioDashboard from '../components/ScenarioDashboard';
import DesignEconomicsView from '../components/slopcast/DesignEconomicsView';
import DesignWellsView from '../components/slopcast/DesignWellsView';
import { MapCommandCenter } from '../components/slopcast/MapCommandCenter';
import PageHeader from '../components/slopcast/PageHeader';
import { useSlopcastWorkspace } from '../hooks/useSlopcastWorkspace';

const SlopcastPage: React.FC = () => {
  const ws = useSlopcastWorkspace();

  return (
    <div className={`min-h-screen bg-transparent theme-transition ${ws.atmosphereClass} ${ws.fxClass}`}>
      {ws.BackgroundComponent && (
        <div className="pointer-events-none">
          <Suspense fallback={null}>
            <ws.BackgroundComponent />
          </Suspense>
        </div>
      )}
      {ws.themeId === 'hyperborea' && <div className="theme-aurora" />}

      <PageHeader
        isClassic={ws.isClassic}
        theme={ws.theme}
        themes={ws.themes}
        themeId={ws.themeId}
        setThemeId={ws.setThemeId}
        viewMode={ws.viewMode}
        onSetViewMode={ws.setViewMode}
        designWorkspace={ws.designWorkspace}
        onSetDesignWorkspace={ws.setDesignWorkspace}
        economicsNeedsAttention={ws.economicsNeedsAttention}
        wellsNeedsAttention={ws.wellsNeedsAttention}
        onNavigateHub={() => ws.navigate('/hub')}
        atmosphericOverlays={ws.atmosphericOverlays}
        headerAtmosphereClass={ws.headerAtmosphereClass}
        fxClass={ws.fxClass}
      />

      <main className={ws.designWorkspace === 'WELLS' && ws.viewMode === 'DASHBOARD' ? 'relative flex-1' : 'p-4 md:p-6 max-w-[1920px] mx-auto w-full'}>

        {ws.viewMode === 'ANALYSIS' ? (
          <ScenarioDashboard
            groups={ws.processedGroups}
            wells={ws.wells}
            scenarios={ws.scenarios}
            setScenarios={ws.handleSetScenarios}
          />
        ) : (
          <>
            {ws.designWorkspace === 'WELLS' ? (
              ws.viewportLayout === 'mobile' ? (
                <div className="mx-auto w-full max-w-[1920px] px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 sm:px-4">
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
              )
            ) : (
              <DesignEconomicsView
                isClassic={ws.isClassic}
                themeId={ws.themeId}
                workflowSteps={ws.workflowSteps}
                mobilePanel={ws.economicsMobilePanel}
                onSetMobilePanel={ws.setEconomicsMobilePanel}
                resultsTab={ws.economicsResultsTab}
                onSetResultsTab={ws.setEconomicsResultsTab}
                wells={ws.wells}
                groups={ws.processedGroups}
                activeGroupId={ws.activeGroupId}
                onActivateGroup={ws.setActiveGroupId}
                onCloneGroup={ws.handleCloneGroup}
                activeGroup={ws.activeGroup}
                onUpdateGroup={ws.handleUpdateGroup}
                onMarkDirty={() => {}}
                controlsOpenSection={ws.controlsOpenSection}
                onControlsOpenHandled={() => ws.setControlsOpenSection(null)}
                hasGroup={ws.hasGroup}
                hasGroupWells={ws.hasGroupWells}
                hasCapexItems={ws.hasCapexItems}
                aggregateMetrics={ws.aggregateMetrics}
                aggregateFlow={ws.aggregateFlow}
                operationsProps={ws.operationsProps}
                breakevenOilPrice={ws.breakevenOilPrice}
                isDerivedComputing={ws.isDerivedComputing}
                runCompleteToken={ws.runCompleteToken}
              />
            )}
          </>
        )}

      </main>
    </div>
  );
};

export default SlopcastPage;
