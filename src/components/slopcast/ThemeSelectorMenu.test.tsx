import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTheme, THEMES } from '../../theme/registry';
import ThemeSelectorMenu from './ThemeSelectorMenu';

function renderSelector(themeId = 'slate') {
  const setThemeId = vi.fn();

  render(
    <ThemeSelectorMenu
      isClassic={themeId === 'mario'}
      theme={getTheme(themeId)}
      themes={THEMES}
      themeId={themeId}
      setThemeId={setThemeId}
    />,
  );

  return { setThemeId };
}

describe('ThemeSelectorMenu', () => {
  afterEach(() => {
    cleanup();
  });

  it('opens from an accessible trigger and renders theme descriptions', () => {
    renderSelector('slate');

    const trigger = screen.getByRole('button', { name: /theme slate/i });
    fireEvent.click(trigger);

    const listbox = screen.getByRole('listbox', { name: /choose theme/i });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(within(listbox).getByRole('option', { name: /slate/i }).getAttribute('aria-selected')).toBe('true');
    expect(within(listbox).getByText(/deal intelligence/i)).toBeTruthy();
    expect(within(listbox).getAllByText('Light').length).toBeGreaterThan(0);
  });

  it('selects a theme with keyboard navigation and returns focus to the trigger', () => {
    const { setThemeId } = renderSelector('slate');
    const trigger = screen.getByRole('button', { name: /theme slate/i });

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const listbox = screen.getByRole('listbox', { name: /choose theme/i });
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    fireEvent.keyDown(listbox, { key: 'Enter' });

    expect(setThemeId).toHaveBeenCalledWith('synthwave');
    expect(screen.queryByRole('listbox', { name: /choose theme/i })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('supports Home, End, Space, Escape, and outside click behavior', () => {
    const { setThemeId } = renderSelector('slate');
    const trigger = screen.getByRole('button', { name: /theme slate/i });

    fireEvent.click(trigger);
    let listbox = screen.getByRole('listbox', { name: /choose theme/i });
    fireEvent.keyDown(listbox, { key: 'End' });
    expect(within(listbox).getByRole('option', { name: /permian/i }).getAttribute('data-active')).toBe('true');
    fireEvent.keyDown(listbox, { key: 'Home' });
    expect(within(listbox).getByRole('option', { name: /slate/i }).getAttribute('data-active')).toBe('true');
    fireEvent.keyDown(listbox, { key: 'Escape' });
    expect(screen.queryByRole('listbox', { name: /choose theme/i })).toBeNull();

    fireEvent.click(trigger);
    listbox = screen.getByRole('listbox', { name: /choose theme/i });
    fireEvent.keyDown(listbox, { key: 'End' });
    fireEvent.keyDown(listbox, { key: ' ' });
    expect(setThemeId).toHaveBeenCalledWith('permian');

    fireEvent.click(trigger);
    expect(screen.getByRole('listbox', { name: /choose theme/i })).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox', { name: /choose theme/i })).toBeNull();
  });
});
