import React, { Suspense } from 'react';
import { MOCK_WELLS } from '../constants';
import ScenarioDashboard from '../components/ScenarioDashboard';
import DesignEconomicsView from '../components/slopcast/DesignEconomicsView';
import DesignWellsView from '../components/slopcast/DesignWellsView';
import KeyboardShortcutsHelp from '../components/slopcast/KeyboardShortcutsHelp';
import OnboardingTour, { ONBOARDING_STORAGE_KEY } from '../components/slopcast/OnboardingTour';
import ProjectSharePanel from '../components/slopcast/ProjectSharePanel';
import LandingPage from '../components/slopcast/LandingPage';
import AiAssistant from '../components/slopcast/AiAssistant';
import ForecastGrid from '../components/slopcast/ForecastGrid';
import EngineComparisonPanel from '../components/slopcast/EngineComparisonPanel';
import { AppShell } from '../components/layout/AppShell';
import { useSlopcastWorkspace } from '../hooks/useSlopcastWorkspace';

const SlopcastPage: React.FC = () => {
  const w = useSlopcastWorkspace();

  // Landing page -- unchanged, no sidebar
  if (w.pageMode === 'landing') {
    return (
      <div className={`min-h-screen bg-transparent theme-transition ${w.atmosphereClass} ${w.fxClass}`}>
        {w.BackgroundComponent && (
          <Suspense fallback={null}>
            <w.BackgroundComponent />
          </Suspense>
        )}
        <LandingPage
          isClassic={w.isClassic}
          theme={w.theme}
          deals={w.savedDeals}
          onSelectDeal={w.handleSelectDeal}
          onCreateDeal={w.handleCreateDeal}
          onSearch={w.handleAcreageSearch}
          onEnterWorkspace={() => w.setPageMode('workspace')}
          wells={MOCK_WELLS}
          activeGroup={w.activeGroup}
        />
      </div>
    );
  }

  return (
    <>
      <AppShell workspace={w}>
        {/* Content rendered based on workspace state (synced from sidebar via useSidebarNav) */}
        {w.viewMode === 'ANALYSIS' ? (
          <ScenarioDashboard
            groups={w.processedGroups}
            wells={MOCK_WELLS}
            scenarios={w.scenarios}
            setScenarios={w.handleSetScenarios}
          />
        ) : (
          <>
            {w.designWorkspace === 'WELLS' ? (
              <DesignWellsView
                isClassic={w.isClassic}
                theme={w.theme}
                themeId={w.themeId}
                viewportLayout={w.viewportLayout}
                mobilePanel={w.wellsMobilePanel}
                onSetMobilePanel={w.setWellsMobilePanel}
                groups={w.processedGroups}
                activeGroupId={w.activeGroupId}
                selectedWellCount={w.selectedVisibleCount}
                onActivateGroup={w.setActiveGroupId}
                onAddGroup={w.handleAddGroup}
                onCloneGroup={w.handleCloneGroup}
                onAssignWells={w.handleAssignWellsToActive}
                onCreateGroupFromSelection={w.handleCreateGroupFromSelection}
                onSelectAll={w.handleSelectAll}
                onClearSelection={w.handleClearSelection}
                operatorFilter={w.operatorFilter}
                formationFilter={w.formationFilter}
                statusFilter={w.statusFilter}
                operatorOptions={w.operatorOptions}
                formationOptions={w.formationOptions}
                statusOptions={w.statusOptions}
                onSetOperatorFilter={w.setOperatorFilter}
                onSetFormationFilter={w.setFormationFilter}
                onSetStatusFilter={(value) => w.setStatusFilter(value)}
                onResetFilters={w.handleResetFilters}
                filteredWellsCount={w.filteredWells.length}
                totalWellCount={MOCK_WELLS.length}
                wells={MOCK_WELLS}
                selectedWellIds={w.selectedWellIds}
                visibleWellIds={w.visibleWellIds}
                dimmedWellIds={w.dimmedWellIds}
                onToggleWell={w.handleToggleWell}
                onSelectWells={w.handleSelectWells}
              />
            ) : (
              <DesignEconomicsView
                isClassic={w.isClassic}
                themeId={w.themeId}
                workflowSteps={w.workflowSteps}
                mobilePanel={w.economicsMobilePanel}
                onSetMobilePanel={w.setEconomicsMobilePanel}
                resultsTab={w.economicsResultsTab}
                onSetResultsTab={w.setEconomicsResultsTab}
                focusMode={w.economicsFocusMode}
                onToggleFocusMode={() => w.setEconomicsFocusMode(!w.economicsFocusMode)}
                onRequestOpenControlsSection={w.handleRequestOpenControlsSection}
                onRequestOpenAnalysisSection={w.handleRequestOpenAnalysisSection}
                wells={MOCK_WELLS}
                groups={w.processedGroups}
                activeGroupId={w.activeGroupId}
                onActivateGroup={w.setActiveGroupId}
                onCloneGroup={w.handleCloneGroup}
                activeGroup={w.activeGroup}
                onUpdateGroup={w.handleUpdateGroup}
                onMarkDirty={() => {}}
                controlsOpenSection={w.controlsOpenSection}
                onControlsOpenHandled={() => w.setControlsOpenSection(null)}
                hasGroup={w.hasGroup}
                hasGroupWells={w.hasGroupWells}
                hasCapexItems={w.hasCapexItems}
                aggregateMetrics={w.aggregateMetrics}
                aggregateFlow={w.aggregateFlow}
                operationsProps={w.operationsProps}
                breakevenOilPrice={w.breakevenOilPrice}
                snapshotHistory={w.snapshotHistory}
                showAfterTax={w.showAfterTax}
                showLevered={w.showLevered}
                onToggleAfterTax={w.setShowAfterTax}
                onToggleLevered={w.setShowLevered}
              />
            )}

            {/* Forecast Grid */}
            {w.designWorkspace === 'ECONOMICS' && w.aggregateFlow.length > 0 && (
              <div className="mt-4">
                <ForecastGrid
                  isClassic={w.isClassic}
                  flow={w.aggregateFlow}
                  readOnly
                />
              </div>
            )}

            {/* Engine Comparison Panel */}
            {w.designWorkspace === 'ECONOMICS' && (
              <div className="mt-4">
                <EngineComparisonPanel
                  isClassic={w.isClassic}
                  tsResult={w.aggregateFlow.length > 0 ? { flow: w.aggregateFlow, metrics: w.aggregateMetrics } : null}
                  pyResult={null}
                />
              </div>
            )}
          </>
        )}
      </AppShell>

      {/* Overlays -- outside AppShell, rendered at page level */}
      <AiAssistant
        isClassic={w.isClassic}
        activeGroup={w.activeGroup}
        onUpdateGroup={w.handleUpdateGroup}
        onUpdatePricing={(pricingUpdates) => {
          w.handleSetScenarios(prev => prev.map(s => s.isBaseCase
            ? { ...s, pricing: { ...s.pricing, ...pricingUpdates } }
            : s
          ));
        }}
        onUpdateScalars={(scalars) => {
          w.handleSetScenarios(prev => prev.map(s => s.isBaseCase
            ? { ...s, capexScalar: scalars.capex, productionScalar: scalars.production }
            : s
          ));
        }}
        currentScalars={{
          capex: (w.scenarios.find(s => s.isBaseCase) || w.scenarios[0])?.capexScalar ?? 1,
          production: (w.scenarios.find(s => s.isBaseCase) || w.scenarios[0])?.productionScalar ?? 1,
        }}
      />

      <OnboardingTour isClassic={w.isClassic} />

      <KeyboardShortcutsHelp isClassic={w.isClassic} open={w.showShortcutsHelp} onClose={() => w.setShowShortcutsHelp(false)} />

      <ProjectSharePanel
        isClassic={w.isClassic}
        open={w.showSharePanel}
        onClose={() => w.setShowSharePanel(false)}
        members={[]}
        onInvite={() => {}}
        onRemoveMember={() => {}}
        onUpdateRole={() => {}}
      />
    </>
  );
};

export default SlopcastPage;
