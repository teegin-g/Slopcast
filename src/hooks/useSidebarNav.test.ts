import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useSidebarNav } from './useSidebarNav';

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(MemoryRouter, { initialEntries: ['/'] }, children);
}

function wrapperWithSection(section: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      MemoryRouter,
      { initialEntries: [`/?section=${section}`] },
      children
    );
  };
}

describe('useSidebarNav', () => {
  it('defaults to wells when no section param exists', () => {
    const { result } = renderHook(() => useSidebarNav(), { wrapper });
    expect(result.current.section).toBe('wells');
  });

  it('reads section from URL params', () => {
    const { result } = renderHook(() => useSidebarNav(), {
      wrapper: wrapperWithSection('economics'),
    });
    expect(result.current.section).toBe('economics');
  });

  it('reads scenarios section from URL params', () => {
    const { result } = renderHook(() => useSidebarNav(), {
      wrapper: wrapperWithSection('scenarios'),
    });
    expect(result.current.section).toBe('scenarios');
  });

  it('defaults to wells for invalid section param', () => {
    const { result } = renderHook(() => useSidebarNav(), {
      wrapper: wrapperWithSection('invalid'),
    });
    expect(result.current.section).toBe('wells');
  });

  it('setSection updates the section', () => {
    const { result } = renderHook(() => useSidebarNav(), { wrapper });
    act(() => {
      result.current.setSection('economics');
    });
    expect(result.current.section).toBe('economics');
  });
});
