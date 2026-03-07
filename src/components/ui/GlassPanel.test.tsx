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

  it('uses theme surface tokens via Tailwind classes when isClassic=false', () => {
    const { container } = render(
      <GlassPanel isClassic={false}>content</GlassPanel>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('bg-theme-surface1/60');
    expect(div.className).toContain('border-theme-border/30');
    expect(div.className).toContain('shadow-[var(--shadow-card)]');
    expect(div.className).toContain('rounded-panel');
    // No inline glass styles — all via Tailwind classes
    expect(div.style.background).toBe('');
    expect(div.style.backdropFilter).toBe('');
  });

  it('falls back to rounded-panel class without theme surface classes when isClassic=true', () => {
    const { container } = render(
      <GlassPanel isClassic={true}>content</GlassPanel>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('rounded-panel');
    expect(div.className).toContain('theme-transition');
    expect(div.className).not.toContain('bg-theme-surface1');
  });

  it('applies hover classes when hover=true', () => {
    const { container } = render(
      <GlassPanel isClassic={false} hover>content</GlassPanel>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('hover:bg-theme-surface1/70');
    expect(div.className).toContain('hover:scale-[1.005]');
    expect(div.className).toContain('transition-all');
  });

  it('does not apply hover classes when hover=false (default)', () => {
    const { container } = render(
      <GlassPanel isClassic={false}>content</GlassPanel>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).not.toContain('hover:bg-theme-surface1/70');
  });

  it('applies accent border when accent prop is set', () => {
    const { container } = render(
      <GlassPanel isClassic={false} accent="cyan">content</GlassPanel>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('border-theme-cyan/40');
  });

  it('uses default border when accent is none', () => {
    const { container } = render(
      <GlassPanel isClassic={false} accent="none">content</GlassPanel>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('border-theme-border/30');
  });

  it('merges custom className', () => {
    const { container } = render(
      <GlassPanel isClassic={false} className="custom-class">content</GlassPanel>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('custom-class');
  });
});
