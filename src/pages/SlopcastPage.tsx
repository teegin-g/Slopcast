import React, { Suspense } from 'react';
import { MOCK_WELLS } from '../constants';
import ScenarioDashboard from '../components/ScenarioDashboard';
import DesignEconomicsView from '../components/slopcast/DesignEconomicsView';
import DesignWellsView from '../components/slopcast/DesignWellsView';
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

      <main className="p-4 md:p-6 max-w-[1920px] mx-auto w-full">
        {ws.viewMode === 'ANALYSIS' ? (
          <ScenarioDashboard
            groups={ws.processedGroups}
            wells={MOCK_WELLS}
            scenarios={ws.scenarios}
            setScenarios={ws.handleSetScenarios}
          />
        ) : (
          <>
            {ws.designWorkspace === 'WELLS' ? (
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
                onSetOperatorFilter={ws.setOperatorFilter}
                onSetFormationFilter={ws.setFormationFilter}
                onSetStatusFilter={(value) => ws.setStatusFilter(value)}
                onResetFilters={ws.handleResetFilters}
                filteredWellsCount={ws.filteredWells.length}
                totalWellCount={MOCK_WELLS.length}
                wells={MOCK_WELLS}
                selectedWellIds={ws.selectedWellIds}
                visibleWellIds={ws.visibleWellIds}
                dimmedWellIds={ws.dimmedWellIds}
                onToggleWell={ws.handleToggleWell}
                onSelectWells={ws.handleSelectWells}
              />
            ) : (
              <DesignEconomicsView
                isClassic={ws.isClassic}
                themeId={ws.themeId}
                workflowSteps={ws.workflowSteps}
                mobilePanel={ws.economicsMobilePanel}
                onSetMobilePanel={ws.setEconomicsMobilePanel}
                resultsTab={ws.economicsResultsTab}
                onSetResultsTab={ws.setEconomicsResultsTab}
                wells={MOCK_WELLS}
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
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SlopcastPage;
