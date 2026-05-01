import { useEffect, useRef, useState } from 'react';
import type { DesignWorkspace } from '../DesignWorkspaceTabs';
import type { EconomicsModule } from '../economics/types';
import type { EconomicsMobilePanel } from '../DesignEconomicsView';
import type { WellsMobilePanel } from '../DesignWellsView';
import {
  getDesignWorkspace,
  getEconomicsFocusMode,
  getEconomicsModule,
} from '../../../services/storage/workspacePreferences';
import { getViewportLayout, useViewportLayout } from './useViewportLayout';

export type ViewMode = 'DASHBOARD' | 'ANALYSIS';
export type OpsTab = 'SELECTION_ACTIONS' | 'KEY_DRIVERS';
export type FxMode = 'cinematic' | 'max';
export type ControlsSection = 'TYPE_CURVE' | 'CAPEX' | 'OPEX' | 'OWNERSHIP';
export type AnalysisOpenSection = 'PRICING' | 'SCHEDULE' | 'SCALARS';
export type PageMode = 'landing' | 'workspace';

export function useWorkspaceUiState() {
  const [pageMode, setPageMode] = useState<PageMode>('landing');
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [designWorkspace, setDesignWorkspace] = useState<DesignWorkspace>(getDesignWorkspace);
  const [wellsMobilePanel, setWellsMobilePanel] = useState<WellsMobilePanel>(() => {
    if (typeof window === 'undefined') return 'MAP';
    return getViewportLayout(window.innerWidth) === 'mobile' ? 'GROUPS' : 'MAP';
  });
  const [economicsMobilePanel, setEconomicsMobilePanel] = useState<EconomicsMobilePanel>('RESULTS');
  const [economicsModule, setEconomicsModule] = useState<EconomicsModule>(getEconomicsModule);
  const [economicsFocusMode, setEconomicsFocusMode] = useState<boolean>(getEconomicsFocusMode);
  const [opsTab, setOpsTab] = useState<OpsTab>('SELECTION_ACTIONS');
  const [controlsOpenSection, setControlsOpenSection] = useState<ControlsSection | null>(null);
  const viewportLayout = useViewportLayout();
  const previousViewportLayoutRef = useRef(viewportLayout);

  useEffect(() => {
    const previousLayout = previousViewportLayoutRef.current;
    if (viewportLayout === 'mobile' && previousLayout !== 'mobile') {
      setWellsMobilePanel('GROUPS');
    }
    previousViewportLayoutRef.current = viewportLayout;
  }, [viewportLayout]);

  return {
    pageMode,
    setPageMode,
    viewMode,
    setViewMode,
    designWorkspace,
    setDesignWorkspace,
    wellsMobilePanel,
    setWellsMobilePanel,
    economicsMobilePanel,
    setEconomicsMobilePanel,
    economicsModule,
    setEconomicsModule,
    economicsFocusMode,
    setEconomicsFocusMode,
    opsTab,
    setOpsTab,
    controlsOpenSection,
    setControlsOpenSection,
    viewportLayout,
  };
}
