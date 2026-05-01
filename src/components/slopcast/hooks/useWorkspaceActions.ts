import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { DealMetrics, MonthlyCashFlow, Scenario } from '../../../types';
import type { ScenarioRanking } from '../../../domain/workspace/selectors';
import { DEFAULT_COMMODITY_PRICING } from '../../../constants';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';

const csvCell = (value: string | number) => {
  const raw = String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

interface WorkspaceActionsArgs {
  aggregateMetrics: DealMetrics;
  aggregateFlow: MonthlyCashFlow[];
  portfolioRoi: number;
  scenarios: Scenario[];
  activeScenarioId: string;
  activeGroupName: string;
  scenarioRankings: ScenarioRanking[];
  validationWarnings: string[];
  supabasePersistenceEnabled: boolean;
  runEconomicsSnapshot: (
    aggregateMetrics: DealMetrics,
    scenarioRankings: ScenarioRanking[],
    warnings: string[],
  ) => Promise<void>;
  setSnapshotHistory: Dispatch<SetStateAction<Array<{ npv: number; capex: number; eur: number; payout: number; timestamp: number }>>>;
  setLastSnapshotAt: Dispatch<SetStateAction<string | null>>;
  setActionMessage: Dispatch<SetStateAction<string>>;
  onSwitchToWells: () => void;
  onSwitchToEconomics: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onShowHelp: () => void;
}

export function useWorkspaceActions({
  aggregateMetrics,
  aggregateFlow: _aggregateFlow,
  portfolioRoi,
  scenarios,
  activeScenarioId,
  activeGroupName,
  scenarioRankings,
  validationWarnings,
  supabasePersistenceEnabled,
  runEconomicsSnapshot,
  setSnapshotHistory,
  setLastSnapshotAt,
  setActionMessage,
  onSwitchToWells,
  onSwitchToEconomics,
  onSelectAll,
  onClearSelection,
  onShowHelp,
}: WorkspaceActionsArgs) {
  const handleSaveSnapshot = useCallback(async () => {
    setSnapshotHistory(prev => [
      ...prev.slice(-19),
      {
        npv: aggregateMetrics.npv10,
        capex: aggregateMetrics.totalCapex,
        eur: aggregateMetrics.eur,
        payout: aggregateMetrics.payoutMonths,
        timestamp: Date.now(),
      },
    ]);

    if (!supabasePersistenceEnabled) {
      setLastSnapshotAt(new Date().toISOString());
      setActionMessage('Snapshot saved locally.');
      return;
    }

    try {
      await runEconomicsSnapshot(aggregateMetrics, scenarioRankings, validationWarnings);
      setLastSnapshotAt(new Date().toISOString());
      setActionMessage(`${activeGroupName} Snapshot saved.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Snapshot save failed.';
      setActionMessage(`Snapshot save failed: ${message}`);
    }
  }, [
    activeGroupName,
    aggregateMetrics,
    runEconomicsSnapshot,
    scenarioRankings,
    setActionMessage,
    setLastSnapshotAt,
    setSnapshotHistory,
    supabasePersistenceEnabled,
    validationWarnings,
  ]);

  const handleExportCsv = useCallback(() => {
    const baseScenario = scenarios.find(s => s.isBaseCase) || scenarios[0];
    const activeScenario = scenarios.find(s => s.id === activeScenarioId) || baseScenario;
    const activePricing = activeScenario?.pricing || DEFAULT_COMMODITY_PRICING;
    const rows: Array<Array<string | number>> = [
      ['scope', 'name', 'wells', 'npv10_mm', 'capex_mm', 'eur_mboe', 'roi_cash', 'payout_months', 'deck_oil', 'deck_gas', 'base_nri', 'base_cost_int'],
      [
        'portfolio',
        'Portfolio',
        aggregateMetrics.wellCount,
        (aggregateMetrics.npv10 / 1e6).toFixed(2),
        (aggregateMetrics.totalCapex / 1e6).toFixed(2),
        (aggregateMetrics.eur / 1e3).toFixed(2),
        portfolioRoi.toFixed(2),
        aggregateMetrics.payoutMonths || '-',
        activePricing.oilPrice,
        activePricing.gasPrice,
        '-',
        '-',
      ],
      ...scenarioRankings.map(row => [
        'group',
        row.name,
        row.wellCount,
        (row.npv10 / 1e6).toFixed(2),
        (row.totalCapex / 1e6).toFixed(2),
        (row.eur / 1e3).toFixed(2),
        row.roi.toFixed(2),
        row.payoutMonths || '-',
        activePricing.oilPrice,
        activePricing.gasPrice,
        row.baseNri.toFixed(3),
        row.baseCostInterest.toFixed(3),
      ]),
    ];

    const csv = rows.map(row => row.map(cell => csvCell(cell)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `slopcast-economics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setActionMessage('CSV export complete.');
  }, [activeScenarioId, aggregateMetrics, portfolioRoi, scenarioRankings, scenarios, setActionMessage]);

  const handleExportPdf = useCallback(() => {
    window.print();
    setActionMessage('Print dialog opened for PDF export.');
  }, [setActionMessage]);

  useKeyboardShortcuts({
    onSwitchToWells,
    onSwitchToEconomics,
    onSaveSnapshot: handleSaveSnapshot,
    onExportCsv: handleExportCsv,
    onSelectAll,
    onClearSelection,
    onShowHelp,
  });

  return {
    handleSaveSnapshot,
    handleExportCsv,
    handleExportPdf,
  };
}
