import { useState, useCallback } from 'react';

export type DockMode = 'group' | 'selection';

export interface UseDockModeResult {
  mode: DockMode;
  /** The active tab id for the CURRENT mode. */
  activeTab: string;
  /** Set the active tab for the current mode (remembered per mode). */
  setActiveTab: (tabId: string) => void;
}

/**
 * Derive dock mode from selection count and track the active tab per mode.
 * @param selectionCount number of currently-selected wells
 * @param defaultGroupTab default tab id for group mode (e.g. 'forecast')
 * @param defaultSelectionTab default tab id for selection mode (e.g. 'summary')
 */
export function useDockMode(
  selectionCount: number,
  defaultGroupTab: string,
  defaultSelectionTab: string,
): UseDockModeResult {
  // Mode is derived, not stored.
  const mode: DockMode = selectionCount > 0 ? 'selection' : 'group';

  // Two independent pieces of tab state — one per mode.
  const [groupTab, setGroupTab] = useState(defaultGroupTab);
  const [selectionTab, setSelectionTab] = useState(defaultSelectionTab);

  const activeTab = mode === 'group' ? groupTab : selectionTab;

  // setActiveTab writes to the CURRENT mode's state only.
  const setActiveTab = useCallback(
    (tabId: string) => {
      if (mode === 'group') {
        setGroupTab(tabId);
      } else {
        setSelectionTab(tabId);
      }
    },
    [mode],
  );

  return { mode, activeTab, setActiveTab };
}
