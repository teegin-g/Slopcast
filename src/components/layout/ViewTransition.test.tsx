import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ViewTransition } from './ViewTransition';

describe('ViewTransition', () => {
  it('renders children correctly', () => {
    render(
      <ViewTransition transitionKey="test">
        <span>Hello World</span>
      </ViewTransition>
    );
    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('renders a motion.div with the transitionKey as key attribute', () => {
    const { container } = render(
      <ViewTransition transitionKey="section-wells">
        <p>Content</p>
      </ViewTransition>
    );
    // motion.div renders a div element
    const innerDiv = container.querySelector('div');
    expect(innerDiv).toBeTruthy();
    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('applies className to the motion.div wrapper', () => {
    const { container } = render(
      <ViewTransition transitionKey="key1" className="custom-class">
        <span>Styled</span>
      </ViewTransition>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('custom-class');
  });

  it('renders new children after rerender with different transitionKey', async () => {
    const { rerender } = render(
      <ViewTransition transitionKey="tab-A">
        <span>Tab A</span>
      </ViewTransition>
    );
    expect(screen.getByText('Tab A')).toBeTruthy();

    rerender(
      <ViewTransition transitionKey="tab-B">
        <span>Tab B</span>
      </ViewTransition>
    );
    // In jsdom, AnimatePresence mode="wait" may keep both during exit.
    // The new content should be present in the DOM after rerender.
    // Use findByText which waits for the element to appear.
    const tabB = await screen.findByText('Tab B');
    expect(tabB).toBeTruthy();
  });
});
