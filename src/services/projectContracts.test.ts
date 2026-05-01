import { describe, expect, it } from 'vitest';
import { parseProjectUiState, unwrapJsonbContract } from './projectContracts';

describe('project JSONB contracts', () => {
  it('removes validator metadata from wrapped objects', () => {
    const parsed = unwrapJsonbContract<{ name: string }>({
      schema_version: 'v1',
      validated_at: '2026-01-01',
      validator_name: 'test',
      name: 'Project',
    });

    expect(parsed).toEqual({ name: 'Project' });
  });

  it('supports persisted multi-select filters', () => {
    const uiState = parseProjectUiState({
      designWorkspace: 'WELLS',
      operatorFilter: ['A', 'B'],
      statusFilter: ['PRODUCING'],
    });

    expect(uiState.operatorFilter).toEqual(['A', 'B']);
    expect(uiState.statusFilter).toEqual(['PRODUCING']);
  });

  it('rejects non-object contracts', () => {
    expect(() => unwrapJsonbContract('bad')).toThrow(/expected object/);
  });
});
