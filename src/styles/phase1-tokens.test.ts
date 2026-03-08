import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Phase 1 validation: STYLE-02 (spacing tokens) and STYLE-03 (typography hierarchy).
 * These tests verify that the CSS infrastructure defines the required design tokens.
 */

const appCss = readFileSync(resolve(__dirname, '../app.css'), 'utf-8');

describe('STYLE-02: Spacing tokens standardized on 4/8/12/16/24/32/48px grid', () => {
  it('app.css documents the compact spacing scale', () => {
    // The spacing scale comment documents the 7-step grid
    expect(appCss).toContain('4px');
    expect(appCss).toContain('8px');
    expect(appCss).toContain('12px');
    expect(appCss).toContain('16px');
    expect(appCss).toContain('24px');
    expect(appCss).toContain('32px');
    expect(appCss).toContain('48px');
  });

  it('spacing scale comment describes each step purpose', () => {
    expect(appCss).toContain('micro gap');
    expect(appCss).toContain('inner gap');
    expect(appCss).toContain('standard gap');
    expect(appCss).toContain('section gap');
  });
});

describe('STYLE-03: Typography hierarchy defined with 5-6 levels', () => {
  it('defines typo-h1 through typo-h3 heading levels', () => {
    expect(appCss).toContain('.typo-h1');
    expect(appCss).toContain('.typo-h2');
    expect(appCss).toContain('.typo-h3');
  });

  it('defines body and caption text levels', () => {
    expect(appCss).toContain('.typo-body');
    expect(appCss).toContain('.typo-caption');
  });

  it('defines label utility for uppercase muted text', () => {
    expect(appCss).toContain('.typo-label');
    // Label should use uppercase and muted color
    const labelLine = appCss.split('\n').find(l => l.includes('.typo-label'));
    expect(labelLine).toContain('uppercase');
    expect(labelLine).toContain('text-theme-muted');
  });

  it('defines section header with accent color', () => {
    expect(appCss).toContain('.typo-section');
    const sectionLine = appCss.split('\n').find(l => l.includes('.typo-section'));
    expect(sectionLine).toContain('uppercase');
    expect(sectionLine).toContain('text-theme-cyan');
  });

  it('defines monospace value utility for tabular numerals', () => {
    expect(appCss).toContain('.typo-value');
    const valueLine = appCss.split('\n').find(l => l.includes('.typo-value'));
    expect(valueLine).toContain('font-mono');
    expect(valueLine).toContain('tabular-nums');
  });

  it('typography classes are in a @layer components block', () => {
    expect(appCss).toContain('@layer components');
  });
});
