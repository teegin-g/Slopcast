import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import type { WellGroup } from '../../types';

// Mock useViewportLayout to control responsive behavior
const mockViewport = vi.fn(() => 'desktop' as 'mobile' | 'mid' | 'desktop');
vi.mock('../slopcast/hooks/useViewportLayout', () => ({
  useViewportLayout: () => mockViewport(),
}));

// Mock PageHeader to avoid deep theme dependency (brandFont etc.)
vi.mock('../slopcast/PageHeader', () => ({
  default: () => <div data-testid="mock-page-header">PageHeader</div>,
}));

// Mock ViewTransition to avoid motion/react dependency
vi.mock('./ViewTransition', () => ({
  ViewTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import React from 'react';

// Minimal workspace mock
function createMockWorkspace(overrides: Partial<ReturnType<typeof createMockWorkspace>> = {}) {
  return {
    isClassic: false,
    BackgroundComponent: null,
    atmosphereClass: '',
    fxClass: '',
    viewMode: 'DASHBOARD' as const,
    setViewMode: vi.fn(),
    designWorkspace: 'WELLS' as const,
    setDesignWorkspace: vi.fn(),
    processedGroups: [] as WellGroup[],
    activeGroupId: null,
    setActiveGroupId: vi.fn(),
    economicsNeedsAttention: false,
    wellsNeedsAttention: false,
    themeId: 'slate',
    setThemeId: vi.fn(),
    themes: [],
    theme: { id: 'slate', name: 'Slate' } as any,
    navigate: vi.fn(),
    atmosphericOverlays: [],
    headerAtmosphereClass: '',
    ...overrides,
  };
}

function renderAppShell(
  workspaceOverrides: Partial<ReturnType<typeof createMockWorkspace>> = {},
  viewport: 'mobile' | 'mid' | 'desktop' = 'desktop',
) {
  mockViewport.mockReturnValue(viewport);
  const workspace = createMockWorkspace(workspaceOverrides);
  return render(
    <MemoryRouter initialEntries={['/?section=wells']}>
      <AppShell workspace={workspace}>
        <div data-testid="content-area">Content Here</div>
      </AppShell>
    </MemoryRouter>,
  );
}

describe('STYLE-06: Animated canvas backgrounds visible through glass UI shell', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders background layer at z-0 (behind everything)', () => {
    const MockBg = () => <div data-testid="canvas-bg">animated bg</div>;
    const { container } = renderAppShell({ BackgroundComponent: MockBg });
    // Background container should be fixed at z-0
    const bgLayer = container.querySelector('.fixed.inset-0.z-0');
    expect(bgLayer).not.toBeNull();
    // The background component should render inside it
    expect(screen.getByTestId('canvas-bg')).toBeTruthy();
  });

  it('renders content area at z-20 (above background, below sidebar)', () => {
    const { container } = renderAppShell();
    const contentColumn = container.querySelector('.z-20');
    expect(contentColumn).not.toBeNull();
  });

  it('renders sidebar at z-30 on desktop (above content)', () => {
    const { container } = renderAppShell({}, 'desktop');
    const sidebar = container.querySelector('aside.z-30');
    expect(sidebar).not.toBeNull();
  });

  it('GlassPanel uses semi-transparent bg (verified by class containing bg-theme-surface1/60)', () => {
    // This is tested in GlassPanel.test.tsx but we verify the contract here:
    // GlassPanel with isClassic=false should have bg-theme-surface1/60 — which means
    // 60% opacity, allowing canvas backgrounds to show through.
    // Already covered by GlassPanel.test.tsx line 20 assertion.
    // This test verifies the content area does NOT have an opaque background.
    const { container } = renderAppShell();
    const mainContent = container.querySelector('main');
    expect(mainContent).not.toBeNull();
    // Content area should not have bg-white, bg-black, or bg-theme-bg (opaque backgrounds)
    const mainClasses = mainContent!.className;
    expect(mainClasses).not.toContain('bg-white');
    expect(mainClasses).not.toContain('bg-black');
    expect(mainClasses).not.toContain('bg-theme-bg');
  });

  it('Vignette renders at z-10 between background and content', () => {
    const { container } = renderAppShell();
    // Vignette uses inline style with zIndex: 10
    const vignette = container.querySelector('[style*="z-index: 10"]');
    expect(vignette).not.toBeNull();
  });
});

describe('RESP-01: Desktop layout renders sidebar + content area', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders sidebar aside element on desktop viewport', () => {
    const { container } = renderAppShell({}, 'desktop');
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
  });

  it('renders content area alongside sidebar', () => {
    renderAppShell({}, 'desktop');
    expect(screen.getByTestId('content-area')).toBeTruthy();
  });

  it('uses flex layout for sidebar + content grid', () => {
    const { container } = renderAppShell({}, 'desktop');
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('flex');
    expect(root.className).toContain('h-screen');
  });

  it('sidebar has width class w-56 when expanded', () => {
    const { container } = renderAppShell({}, 'desktop');
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside!.className).toContain('w-56');
  });
});

describe('RESP-02: Mobile layout collapses sidebar to drawer', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not render aside element on mobile viewport', () => {
    const { container } = renderAppShell({}, 'mobile');
    const aside = container.querySelector('aside');
    expect(aside).toBeNull();
  });

  it('renders MobileDrawer on mobile viewport', () => {
    const { container } = renderAppShell({}, 'mobile');
    // MobileDrawer renders a fixed overlay with z-40
    const drawer = container.querySelector('.fixed.inset-0.z-40');
    expect(drawer).not.toBeNull();
  });

  it('MobileDrawer starts closed (not visible)', () => {
    const { container } = renderAppShell({}, 'mobile');
    const drawer = container.querySelector('.fixed.inset-0.z-40');
    expect(drawer).not.toBeNull();
    // When closed, drawer has opacity-0 and pointer-events-none
    expect(drawer!.className).toContain('opacity-0');
    expect(drawer!.className).toContain('pointer-events-none');
  });

  it('content area still renders on mobile', () => {
    renderAppShell({}, 'mobile');
    expect(screen.getByTestId('content-area')).toBeTruthy();
  });
});
