import React, { Suspense } from 'react';
import ScenarioDashboard from '../components/ScenarioDashboard';
import DesignEconomicsView from '../components/slopcast/DesignEconomicsView';
import DesignWellsView from '../components/slopcast/DesignWellsView';
import { AppShell } from '../components/layout/AppShell';
import { useSlopcastWorkspace } from '../hooks/useSlopcastWorkspace';

const MapCommandCenter = React.lazy(() =>
  import('../components/slopcast/MapCommandCenter').then(module => ({ default: module.MapCommandCenter })),
);

const SlopcastPage: React.FC = () => {
  const ws = useSlopcastWorkspace();

  return (
    <AppShell workspace={ws}>
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
              <Suspense fallback={null}>
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
              </Suspense>
            )
          ) : (
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
          )}
        </>
      )}
    </AppShell>
  );
};

export default SlopcastPage;
