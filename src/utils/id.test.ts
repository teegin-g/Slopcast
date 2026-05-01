import { describe, expect, it } from 'vitest';
import { createLocalId } from './id';

describe('createLocalId', () => {
  it('uses an injectable factory for deterministic IDs', () => {
    expect(createLocalId('g', () => 'fixed')).toBe('g-fixed');
  });
});
