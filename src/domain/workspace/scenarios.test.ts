import { describe, expect, it } from 'vitest';
import { createDefaultScenarios } from './scenarios';

describe('createDefaultScenarios', () => {
  it('creates independent scenario instances', () => {
    const first = createDefaultScenarios();
    const second = createDefaultScenarios();

    first[0].pricing.oilPrice = 1;

    expect(second[0].pricing.oilPrice).not.toBe(1);
    expect(second.find(scenario => scenario.isBaseCase)?.id).toBe('s-base');
  });
});
