import { describe, expect, it } from 'vitest';
import { DEFAULT_CAPEX, DEFAULT_OPEX, DEFAULT_OWNERSHIP, DEFAULT_TYPE_CURVE } from '../../constants';
import type { WellGroup } from '../../types';
import {
  appendWorkspaceGroup,
  assignWellsToActiveGroup,
  clearGroupAssignments,
  cloneWorkspaceGroup,
  createGroupFromSelection,
  updateWorkspaceGroup,
} from './groupState';

const makeGroup = (id: string, wellIds: string[] = []): WellGroup => ({
  id,
  name: id,
  color: '#fff',
  wellIds: new Set(wellIds),
  typeCurve: { ...DEFAULT_TYPE_CURVE },
  capex: { ...DEFAULT_CAPEX, items: DEFAULT_CAPEX.items.map((item) => ({ ...item })) },
  opex: { ...DEFAULT_OPEX, segments: DEFAULT_OPEX.segments.map((segment) => ({ ...segment })) },
  ownership: { ...DEFAULT_OWNERSHIP, agreements: [] },
});

describe('workspace group state reducers', () => {
  it('adds and updates groups without mutating existing instances', () => {
    const groups = [makeGroup('g-1')];
    const added = appendWorkspaceGroup(groups, 'g-2');
    const updated = updateWorkspaceGroup(added, { ...added[1], name: 'Updated' });

    expect(groups).toHaveLength(1);
    expect(added).toHaveLength(2);
    expect(updated[1].name).toBe('Updated');
    expect(added[1].name).toBe('Group 2');
  });

  it('clones well assignments and assumption arrays', () => {
    const groups = [makeGroup('g-1', ['a', 'b'])];
    const cloned = cloneWorkspaceGroup(groups, 'g-1', 'g-2');

    expect(cloned).toHaveLength(2);
    expect([...cloned[1].wellIds]).toEqual(['a', 'b']);
    expect(cloned[1].capex.items[0]).not.toBe(groups[0].capex.items[0]);
    expect(cloned[1].opex.segments[0]).not.toBe(groups[0].opex.segments[0]);
  });

  it('assigns selected wells only to the active group', () => {
    const groups = [makeGroup('g-1', ['a']), makeGroup('g-2', ['b'])];
    const next = assignWellsToActiveGroup(groups, 'g-2', new Set(['a', 'c']));

    expect([...next[0].wellIds]).toEqual([]);
    expect([...next[1].wellIds].sort()).toEqual(['a', 'b', 'c']);
  });

  it('creates a selection group and removes selected wells from previous groups', () => {
    const groups = [makeGroup('g-1', ['a', 'b']), makeGroup('g-2', ['c'])];
    const next = createGroupFromSelection(groups, 'g-3', new Set(['a', 'c']));

    expect([...next[0].wellIds]).toEqual(['b']);
    expect([...next[1].wellIds]).toEqual([]);
    expect([...next[2].wellIds].sort()).toEqual(['a', 'c']);
  });

  it('clears stale well assignments', () => {
    const next = clearGroupAssignments([makeGroup('g-1', ['a']), makeGroup('g-2', ['b'])]);
    expect(next.every((group) => group.wellIds.size === 0)).toBe(true);
  });
});
