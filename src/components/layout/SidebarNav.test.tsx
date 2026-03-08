import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SidebarNav } from './SidebarNav';
import { GlassCard } from '../ui/GlassCard';
import { GlassPanel } from '../ui/GlassPanel';

const defaultProps = {
  section: 'wells' as const,
  onSetSection: vi.fn(),
  collapsed: false,
  isClassic: false,
};

describe('STYLE-04: Hover and focus-visible states on interactive elements', () => {
  afterEach(() => {
    cleanup();
  });

  it('inactive nav items have hover classes for non-classic theme', () => {
    render(<SidebarNav {...defaultProps} section="wells" />);
    // Economics is inactive when section is 'wells'
    const economicsBtn = screen.getByText('Economics').closest('button')!;
    expect(economicsBtn.className).toContain('hover:bg-theme-cyan/10');
    expect(economicsBtn.className).toContain('hover:text-theme-text');
  });

  it('all nav buttons have focus-visible outline class', () => {
    render(<SidebarNav {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
    for (const btn of buttons) {
      expect(btn.className).toContain('focus-visible:outline-2');
      expect(btn.className).toContain('focus-visible:outline-theme-cyan');
    }
  });

  it('inactive nav items have hover classes for classic (Mario) theme', () => {
    render(<SidebarNav {...defaultProps} isClassic={true} section="economics" />);
    // Wells is inactive
    const wellsBtn = screen.getByText('Wells').closest('button')!;
    expect(wellsBtn.className).toContain('hover:bg-white/5');
    expect(wellsBtn.className).toContain('hover:text-white/90');
  });

  it('GlassCard has hover state class for non-classic theme', () => {
    const { container } = render(
      <GlassCard isClassic={false}>card content</GlassCard>,
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('hover:bg-theme-surface2/65');
  });

  it('GlassPanel with hover=true has focus-visible outline', () => {
    const { container } = render(
      <GlassPanel isClassic={false} hover={true}>panel</GlassPanel>,
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('focus-visible:outline-2');
    expect(div.className).toContain('focus-visible:outline-theme-cyan');
  });

  it('app.css defines a focus-ring utility class', () => {
    const appCss = readFileSync(resolve(__dirname, '../../app.css'), 'utf-8');
    expect(appCss).toContain('.focus-ring');
    expect(appCss).toContain('focus-visible:outline-2');
    expect(appCss).toContain('focus-visible:outline-theme-cyan');
  });
});
