import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock useAuth so we can drive `status` directly.
// ---------------------------------------------------------------------------

const mockUseAuth = vi.fn();
vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

import ProtectedRoute from './ProtectedRoute';

afterEach(() => {
  cleanup();
  mockUseAuth.mockReset();
});

/**
 * Render ProtectedRoute WITHOUT a <ThemeProvider> — this reproduces the
 * dev-only HMR / lazy-route-recovery condition (follow-up #27) where the gate
 * briefly mounts outside the theme context. It must not throw.
 */
function renderWithoutThemeProvider(node: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={node} />
        <Route path="/auth" element={<div data-testid="auth-page">auth</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute (theme resilience — #27)', () => {
  it('renders the loading panel without throwing when no ThemeProvider is present', () => {
    mockUseAuth.mockReturnValue({ status: 'loading' });

    expect(() =>
      renderWithoutThemeProvider(
        <ProtectedRoute>
          <div>protected</div>
        </ProtectedRoute>,
      ),
    ).not.toThrow();

    expect(screen.getByText('Authenticating')).toBeTruthy();
  });

  it('renders children when authenticated, even without a ThemeProvider', () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated' });

    renderWithoutThemeProvider(
      <ProtectedRoute>
        <div data-testid="protected-content">secret</div>
      </ProtectedRoute>,
    );

    expect(screen.getByTestId('protected-content')).toBeTruthy();
  });

  it('redirects to /auth when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated' });

    renderWithoutThemeProvider(
      <ProtectedRoute>
        <div data-testid="protected-content">secret</div>
      </ProtectedRoute>,
    );

    expect(screen.getByTestId('auth-page')).toBeTruthy();
    expect(screen.queryByTestId('protected-content')).toBeNull();
  });
});
