import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlassPanel } from './GlassPanel';

describe('GlassPanel', () => {
  it('renders children', () => {
    render(
      <GlassPanel isClassic={false}>
        <span>Hello</span>
      </GlassPanel>
    );
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('applies glass styles when isClassic=false', () => {
    const { container } = render(
      <GlassPanel isClassic={false}>content</GlassPanel>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.style.background).toBe('var(--glass-panel-bg)');
    expect(div.style.backdropFilter).toBe('blur(var(--glass-panel-blur))');
    expect(div.style.border).toBe('1px solid var(--glass-panel-border)');
    expect(div.style.boxShadow).toBe('var(--glass-panel-shadow)');
    expect(div.className).toContain('rounded-panel');
  });

  it('falls back to rounded-panel class without glass styles when isClassic=true', () => {
    const { container } = render(
      <GlassPanel isClassic={true}>content</GlassPanel>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('rounded-panel');
    expect(div.className).toContain('theme-transition');
    expect(div.style.background).toBe('');
    expect(div.style.backdropFilter).toBe('');
  });

  it('applies hover classes when hover=true', () => {
    const { container } = render(
      <GlassPanel isClassic={false} hover>content</GlassPanel>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('hover:brightness-110');
    expect(div.className).toContain('hover:scale-[1.005]');
    expect(div.className).toContain('transition-all');
  });

  it('does not apply hover classes when hover=false (default)', () => {
    const { container } = render(
      <GlassPanel isClassic={false}>content</GlassPanel>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).not.toContain('hover:brightness-110');
  });

  it('merges custom className', () => {
    const { container } = render(
      <GlassPanel isClassic={false} className="custom-class">content</GlassPanel>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('custom-class');
  });
});
