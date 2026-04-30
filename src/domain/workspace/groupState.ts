import { DEFAULT_CAPEX, DEFAULT_OPEX, DEFAULT_OWNERSHIP, DEFAULT_TYPE_CURVE, GROUP_COLORS } from '../../constants';
import type { WellGroup } from '../../types';

const cloneCapex = (source = DEFAULT_CAPEX, idSeed = 'default') => ({
  ...source,
  items: source.items.map((item, index) => ({ ...item, id: `${item.id}-${idSeed}-${index}` })),
});

const cloneOpex = (source = DEFAULT_OPEX, idSeed = 'default') => ({
  ...source,
  segments: source.segments.map((segment, index) => ({ ...segment, id: `${segment.id}-${idSeed}-${index}` })),
});

const cloneOwnership = (source = DEFAULT_OWNERSHIP, idSeed = 'default') => ({
  ...source,
  agreements: source.agreements.map((agreement, index) => ({ ...agreement, id: `${agreement.id}-${idSeed}-${index}` })),
});

export const createWorkspaceGroup = (
  groups: WellGroup[],
  id: string,
  name = `Group ${groups.length + 1}`,
  wellIds: Iterable<string> = [],
): WellGroup => ({
  id,
  name,
  color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
  wellIds: new Set(wellIds),
  typeCurve: { ...DEFAULT_TYPE_CURVE },
  capex: cloneCapex(DEFAULT_CAPEX, id),
  opex: cloneOpex(DEFAULT_OPEX, id),
  ownership: cloneOwnership(DEFAULT_OWNERSHIP, id),
});

export const updateWorkspaceGroup = (groups: WellGroup[], updatedGroup: WellGroup): WellGroup[] =>
  groups.map((group) => (group.id === updatedGroup.id ? updatedGroup : group));

export const appendWorkspaceGroup = (groups: WellGroup[], id: string): WellGroup[] => [
  ...groups,
  createWorkspaceGroup(groups, id),
];

export const cloneWorkspaceGroup = (groups: WellGroup[], sourceGroupId: string, id: string): WellGroup[] => {
  const sourceGroup = groups.find((group) => group.id === sourceGroupId);
  if (!sourceGroup) return groups;
  return [
    ...groups,
    {
      id,
      name: `${sourceGroup.name} (Copy)`,
      color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
      wellIds: new Set(sourceGroup.wellIds),
      typeCurve: { ...sourceGroup.typeCurve },
      capex: cloneCapex(sourceGroup.capex, id),
      opex: cloneOpex(sourceGroup.opex, id),
      ownership: cloneOwnership(sourceGroup.ownership, id),
      reserveCategory: sourceGroup.reserveCategory,
      taxAssumptions: sourceGroup.taxAssumptions ? { ...sourceGroup.taxAssumptions } : undefined,
      debtAssumptions: sourceGroup.debtAssumptions ? { ...sourceGroup.debtAssumptions } : undefined,
    },
  ];
};

export const assignWellsToActiveGroup = (
  groups: WellGroup[],
  activeGroupId: string,
  selectedWellIds: Set<string>,
): WellGroup[] =>
  groups.map((group) => {
    const nextIds = new Set(group.wellIds);
    selectedWellIds.forEach((id) => {
      if (group.id === activeGroupId) {
        nextIds.add(id);
      } else {
        nextIds.delete(id);
      }
    });
    return { ...group, wellIds: nextIds };
  });

export const createGroupFromSelection = (
  groups: WellGroup[],
  id: string,
  selectedWellIds: Set<string>,
): WellGroup[] => {
  const selected = new Set(selectedWellIds);
  const updatedGroups = groups.map((group) => {
    const nextIds = new Set(group.wellIds);
    selected.forEach((wellId) => nextIds.delete(wellId));
    return { ...group, wellIds: nextIds };
  });
  return [
    ...updatedGroups,
    createWorkspaceGroup(groups, id, `Selection Set ${groups.length + 1}`, selected),
  ];
};

export const clearGroupAssignments = (groups: WellGroup[]): WellGroup[] =>
  groups.map((group) => ({ ...group, wellIds: new Set<string>() }));
