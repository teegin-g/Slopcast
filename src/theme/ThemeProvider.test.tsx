import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeProvider';

function ThemeControls() {
  const { setColorMode, setThemeId, themeId } = useTheme();

  return (
    <div>
      <span data-testid="active-theme">{themeId}</span>
      <button type="button" onClick={() => setThemeId('permian')}>
        Permian
      </button>
      <button type="button" onClick={() => setThemeId('mario')}>
        Mario
      </button>
      <button type="button" onClick={() => setColorMode('light')}>
        Light
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-mode');
    document.documentElement.removeAttribute('style');
  });

  it('applies stored theme id to the document root', () => {
    localStorage.setItem('slopcast-theme', 'permian');

    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>,
    );

    expect(document.documentElement.dataset.theme).toBe('permian');
    expect(screen.getByTestId('active-theme').textContent).toBe('permian');
  });

  it('updates data-mode when color mode changes', async () => {
    localStorage.setItem('slopcast-theme', 'permian');

    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>,
    );

    screen.getByRole('button', { name: 'Light' }).click();

    await waitFor(() => {
      expect(document.documentElement.dataset.mode).toBe('light');
    });
  });

  it('updates data-theme when switching themes', async () => {
    localStorage.setItem('slopcast-theme', 'permian');

    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>,
    );

    screen.getByRole('button', { name: 'Mario' }).click();

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('mario');
      expect(screen.getByTestId('active-theme').textContent).toBe('mario');
    });
  });
});
