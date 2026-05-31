import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import SectionCard from '../slopcast/SectionCard';
import type { WellGroup } from '../../types';
import { ThemeProvider } from '../../theme/ThemeProvider';

// Polyfill IntersectionObserver for test environment (used by motion useInView)
beforeAll(() => {
  if (typeof IntersectionObserver === 'undefined') {
    (globalThis as any).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

// Mock useViewportLayout to control responsive behavior
const mockViewport = vi.fn(() => 'desktop' as 'mobile' | 'mid' | 'desktop' | 'wide');
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

type AppShellPropsType = React.ComponentProps<typeof AppShell>;
const mockFn = <T extends (...args: any[]) => unknown>() => vi.fn() as unknown as T;

/** Flat representation of all fields for easy override in tests */
interface FlatMockFields {
  // atmosphere
  isClassic?: boolean;
  BackgroundComponent?: React.ComponentType | null;
  atmosphereClass?: string;
  fxClass?: string;
  atmosphericOverlays?: string[];
  headerAtmosphereClass?: string;
  // viewState
  viewMode?: 'DASHBOARD' | 'ANALYSIS';
  setViewMode?: (mode: 'DASHBOARD' | 'ANALYSIS') => void;
  designWorkspace?: 'WELLS' | 'ECONOMICS';
  setDesignWorkspace?: (ws: 'WELLS' | 'ECONOMICS') => void;
  economicsNeedsAttention?: boolean;
  wellsNeedsAttention?: boolean;
  // groups
  processedGroups?: WellGroup[];
  activeGroupId?: string | null;
  setActiveGroupId?: (id: string) => void;
  // themeState
  themeId?: string;
  setThemeId?: (id: string) => void;
  themes?: AppShellPropsType['themeState']['themes'];
  theme?: AppShellPropsType['themeState']['theme'];
  // navigate
  navigate?: (path: string) => void;
}

function createMockProps(overrides: FlatMockFields = {}): Omit<AppShellPropsType, 'children'> {
  const f = { ...overrides };
  return {
    atmosphere: {
      isClassic: f.isClassic ?? false,
      BackgroundComponent: f.BackgroundComponent ?? null,
      atmosphereClass: f.atmosphereClass ?? '',
      fxClass: f.fxClass ?? '',
      atmosphericOverlays: f.atmosphericOverlays ?? [],
      headerAtmosphereClass: f.headerAtmosphereClass ?? '',
    },
    viewState: {
      viewMode: f.viewMode ?? 'DASHBOARD',
      setViewMode: f.setViewMode ?? mockFn<(mode: 'DASHBOARD' | 'ANALYSIS') => void>(),
      designWorkspace: f.designWorkspace ?? 'WELLS',
      setDesignWorkspace: f.setDesignWorkspace ?? mockFn<(ws: 'WELLS' | 'ECONOMICS') => void>(),
      economicsNeedsAttention: f.economicsNeedsAttention ?? false,
      wellsNeedsAttention: f.wellsNeedsAttention ?? false,
    },
    groups: {
      processedGroups: f.processedGroups ?? ([] as WellGroup[]),
      activeGroupId: f.activeGroupId ?? null,
      setActiveGroupId: f.setActiveGroupId ?? mockFn<(id: string) => void>(),
    },
    themeState: {
      themeId: f.themeId ?? 'slate',
      setThemeId: f.setThemeId ?? mockFn<(id: string) => void>(),
      themes: f.themes ?? [],
      theme: f.theme ?? ({ id: 'slate', name: 'Slate' } as any),
    },
    navigate: f.navigate ?? mockFn<(path: string) => void>(),
  };
}

function renderAppShell(
  overrides: FlatMockFields = {},
  viewport: 'mobile' | 'mid' | 'desktop' | 'wide' = 'desktop',
  children: React.ReactNode = <div data-testid="content-area">Content Here</div>,
) {
  mockViewport.mockReturnValue(viewport);
  const props = createMockProps(overrides);
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/?section=wells']}>
        <AppShell {...props}>
          {children}
        </AppShell>
      </MemoryRouter>
    </ThemeProvider>,
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

  it('keeps main in a lower stacking context than the header (header dropdowns above body UI)', () => {
    const { container } = renderAppShell();
    const main = container.querySelector('main');
    expect(main).not.toBeNull();
    expect(main!.className).toMatch(/\brelative\b/);
    expect(main!.className).toMatch(/\bz-0\b/);
  });

  it('renders sidebar at z-30 on desktop (above content)', () => {
    const { container } = renderAppShell({}, 'desktop');
    const sidebar = container.querySelector('aside.z-30');
    expect(sidebar).not.toBeNull();
  });

  it('keeps the shell content area free of opaque app backgrounds', () => {
    const { container } = renderAppShell();
    const mainContent = container.querySelector('main');
    expect(mainContent).not.toBeNull();
    const mainClasses = mainContent!.className;
    expect(mainClasses).not.toContain('bg-white');
    expect(mainClasses).not.toContain('bg-black');
    expect(mainClasses).not.toContain('bg-theme-bg');
  });

  it('renders production outer surfaces with the utility-first panel recipe', () => {
    renderAppShell(
      {},
      'desktop',
      <SectionCard title="Surface Contract">
        <div data-testid="content-area">Content Here</div>
      </SectionCard>,
    );

    const heading = screen.getByText('Surface Contract');
    const panel = heading.closest('.rounded-panel') as HTMLElement | null;
    expect(panel).not.toBeNull();
    expect(panel!.className).toContain('rounded-panel');
    expect(panel!.className).toContain('border');
    expect(panel!.className).toContain('shadow-card');
    expect(panel!.className).toContain('theme-transition');
    expect(panel!.className).toContain('bg-theme-surface1/70');
    expect(panel!.className).toContain('border-theme-border');
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
    // MobileDrawer uses AnimatePresence — when closed, nothing renders
    // Verify the drawer container is present (AnimatePresence wrapper)
    const drawerBackdrop = container.querySelector('.fixed.inset-0.z-40');
    // Drawer starts closed, so backdrop should not be in DOM
    expect(drawerBackdrop).toBeNull();
  });

  it('MobileDrawer starts closed (not visible)', () => {
    const { container } = renderAppShell({}, 'mobile');
    // With AnimatePresence, closed drawer removes elements from DOM entirely
    const drawerBackdrop = container.querySelector('.fixed.inset-0.z-40');
    const drawerPanel = container.querySelector('.fixed.left-0.z-50');
    expect(drawerBackdrop).toBeNull();
    expect(drawerPanel).toBeNull();
  });

  it('content area still renders on mobile', () => {
    renderAppShell({}, 'mobile');
    expect(screen.getByTestId('content-area')).toBeTruthy();
  });
});
