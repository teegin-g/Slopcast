import type { Meta, StoryObj } from '@storybook/react-vite';
import { MOCK_WELLS } from '../../constants';
import { buildMockDevelopmentInventory, getUndevelopedReadiness, summarizeDevelopmentInventory } from '../../utils/undevelopedInventory';
import { buildProductionHistoryMap, getPdpReadiness, summarizePdpGroup, summarizeProductionUniverse } from '../../utils/pdpForecasting';
import { createStoryGroup } from './storybookData';
import {
  PdpReviewSurface,
  PdpUniverseSurface,
  UndevelopedInventorySurface,
  UndevelopedReviewSurface,
  UndevelopedUniverseSurface,
} from './PdpWorkflowSurfaces';

const wells = MOCK_WELLS.slice(0, 16);
const historyByWellId = buildProductionHistoryMap(wells);
const groups = [
  createStoryGroup('pdp-alpha', 'Tier 1 Core PDP', '#22d3ee', wells.slice(0, 6).map(well => well.id), {
    npv10: 18_400_000,
    eur: 1_280_000,
    wellCount: 6,
  }),
  createStoryGroup('pdp-bravo', 'Wolfcamp PDP', '#a78bfa', wells.slice(6, 11).map(well => well.id), {
    npv10: 11_900_000,
    eur: 820_000,
    wellCount: 5,
  }),
].map(group => ({
  ...group,
  pdpForecast: summarizePdpGroup(group, wells, historyByWellId),
  dataQualityAcknowledged: true,
}));
const summaries = groups.map(group => group.pdpForecast!);
const readiness = getPdpReadiness(groups, summaries);
const developmentInventory = buildMockDevelopmentInventory();
const developmentSummary = summarizeDevelopmentInventory(
  developmentInventory.groups,
  developmentInventory.dsus,
  developmentInventory.plannedWells,
);
const undevelopedReadiness = getUndevelopedReadiness(developmentInventory.groups, developmentSummary);

const meta = {
  title: 'Slopcast/PDP Workflow Surfaces',
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Universe: Story = {
  render: () => (
    <PdpUniverseSurface
      filteredWells={wells}
      totalWellCount={MOCK_WELLS.length}
      operatorFilter={new Set()}
      formationFilter={new Set()}
      statusFilter={new Set(['PRODUCING'])}
      operatorOptions={Array.from(new Set(wells.map(well => well.operator)))}
      formationOptions={Array.from(new Set(wells.map(well => well.formation)))}
      statusOptions={['PRODUCING', 'DUC', 'PERMIT']}
      onToggleOperator={() => {}}
      onToggleFormation={() => {}}
      onToggleStatus={() => {}}
      onResetFilters={() => {}}
      historyByWellId={historyByWellId}
      summary={summarizeProductionUniverse(wells, historyByWellId)}
      onContinue={() => {}}
    />
  ),
};

export const Review: Story = {
  render: () => (
    <PdpReviewSurface
      groups={groups}
      summaries={summaries}
      readiness={readiness}
      activeScenarioName="Base Case"
      onAcknowledge={() => {}}
      onOpenScenarios={() => {}}
    />
  ),
};

export const UndevelopedUniverse: Story = {
  render: () => (
    <UndevelopedUniverseSurface
      inventory={developmentInventory}
      summary={developmentSummary}
      readiness={undevelopedReadiness}
      onContinue={() => {}}
    />
  ),
};

export const UndevelopedInventory: Story = {
  render: () => (
    <UndevelopedInventorySurface
      inventory={developmentInventory}
      summary={developmentSummary}
      readiness={undevelopedReadiness}
      onContinue={() => {}}
    />
  ),
};

export const UndevelopedReview: Story = {
  render: () => (
    <UndevelopedReviewSurface
      inventory={developmentInventory}
      summary={developmentSummary}
      readiness={undevelopedReadiness}
      activeScenarioName="Base Case"
      onOpenScenarios={() => {}}
    />
  ),
};
