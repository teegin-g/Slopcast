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

  it('applies inner card glass styles when isClassic=false', () => {
    const { container } = render(
      <GlassCard isClassic={false}>content</GlassCard>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.style.background).toBe('var(--glass-card-bg)');
    expect(div.style.border).toBe('1px solid var(--glass-card-border)');
    expect(div.className).toContain('rounded-inner');
  });

  it('does not apply backdrop-filter on inner cards (performance)', () => {
    const { container } = render(
      <GlassCard isClassic={false}>content</GlassCard>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.style.backdropFilter).toBe('');
  });

  it('falls back to rounded-inner class without glass styles when isClassic=true', () => {
    const { container } = render(
      <GlassCard isClassic={true}>content</GlassCard>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('rounded-inner');
    expect(div.className).toContain('theme-transition');
    expect(div.style.background).toBe('');
    expect(div.style.border).toBe('');
  });

  it('merges custom className', () => {
    const { container } = render(
      <GlassCard isClassic={false} className="my-custom">content</GlassCard>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('my-custom');
  });
});
