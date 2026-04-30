import { describe, expect, it } from 'vitest';
import {
  mapEconomicsRunRow,
  mapProjectGroupRow,
  mapProjectRow,
  mapProjectScenarioRow,
} from './projectRepository';

describe('project repository row mappers', () => {
  it('strips JSONB contract metadata at load boundaries', () => {
    const project = mapProjectRow({
      id: 'p-1',
      organization_id: 'org-1',
      owner_user_id: 'u-1',
      project_kind: 'slopcast',
      status: 'active',
      name: 'Project',
      description: null,
      active_group_id: 'g-1',
      current_version_id: 'v-1',
      ui_state_jsonb: { schema_version: '1', designWorkspace: 'WELLS' },
      metadata_jsonb: { validated_at: 'now', foo: 'bar' },
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
    });

    expect(project.uiState).toEqual({ designWorkspace: 'WELLS' });
    expect(project.metadata).toEqual({ foo: 'bar' });
  });

  it('maps group and scenario JSONB contracts explicitly', () => {
    const group = mapProjectGroupRow({
      id: 'g-1',
      project_id: 'p-1',
      name: 'Group',
      color: '#fff',
      sort_order: 1,
      config_jsonb: {
        typeCurve: { qi: 1 },
        capex: { items: [] },
        opex: { segments: [] },
        ownership: { baseNri: 0.8 },
      },
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
    }, new Map([['g-1', ['api-1']]]));

    const scenario = mapProjectScenarioRow({
      id: 's-1',
      project_id: 'p-1',
      name: 'Base',
      color: '#fff',
      is_base_case: true,
      pricing_jsonb: { oilPrice: 70 },
      schedule_jsonb: { annualRigs: [1] },
      scalar_jsonb: { capexScalar: 1.1, productionScalar: 0.9 },
      sort_order: 1,
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
    });

    expect(group.wellIds).toEqual(['api-1']);
    expect(group.typeCurve).toEqual({ qi: 1 });
    expect(scenario.capexScalar).toBe(1.1);
    expect(scenario.productionScalar).toBe(0.9);
  });

  it('rejects non-object JSONB contracts instead of casting blindly', () => {
    expect(() => mapProjectRow({
      id: 'p-1',
      organization_id: 'org-1',
      owner_user_id: 'u-1',
      project_kind: 'slopcast',
      status: 'active',
      name: 'Project',
      description: null,
      active_group_id: null,
      current_version_id: null,
      ui_state_jsonb: 'bad',
      metadata_jsonb: {},
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
    })).toThrow(/ui_state_jsonb/);
  });

  it('maps run metadata and validates portfolio metrics JSONB', () => {
    const run = mapEconomicsRunRow({
      id: 'r-1',
      project_id: 'p-1',
      project_version_id: 'v-1',
      triggered_by: 'u-1',
      input_hash: 'economics-input-v1:abc',
      run_kind: 'analysis',
      engine_version: 'typescript:parity-v1',
      portfolio_metrics: { npv10: 123 },
      warnings: ['check me'],
      created_at: '2026-01-01',
    });

    expect(run.engineVersion).toBe('typescript:parity-v1');
    expect(run.portfolioMetrics).toEqual({ npv10: 123 });
    expect(run.warnings).toEqual(['check me']);
  });
});
