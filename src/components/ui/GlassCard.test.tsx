import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlassCard } from './GlassCard';

describe('GlassCard', () => {
  it('renders children', () => {
    render(
      <GlassCard isClassic={false}>
        <span>Card content</span>
      </GlassCard>
    );
    expect(screen.getByText('Card content')).toBeTruthy();
  });

  it('uses theme surface-2 tokens via Tailwind classes when isClassic=false', () => {
    const { container } = render(
      <GlassCard isClassic={false}>content</GlassCard>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('bg-theme-surface2/50');
    expect(div.className).toContain('border-theme-border/20');
    expect(div.className).toContain('hover:bg-theme-surface2/65');
    expect(div.className).toContain('rounded-inner');
    // No inline styles — all via Tailwind classes
    expect(div.style.background).toBe('');
    expect(div.style.border).toBe('');
  });

  it('does not apply backdrop-filter on inner cards (performance)', () => {
    const { container } = render(
      <GlassCard isClassic={false}>content</GlassCard>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.style.backdropFilter).toBe('');
  });

  it('falls back to rounded-inner class without theme surface classes when isClassic=true', () => {
    const { container } = render(
      <GlassCard isClassic={true}>content</GlassCard>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('rounded-inner');
    expect(div.className).toContain('theme-transition');
    expect(div.className).not.toContain('bg-theme-surface2');
  });

  it('merges custom className', () => {
    const { container } = render(
      <GlassCard isClassic={false} className="my-custom">content</GlassCard>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('my-custom');
  });
});
