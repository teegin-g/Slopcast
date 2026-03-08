import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InlineEditableValue } from './InlineEditableValue';

afterEach(cleanup);

describe('InlineEditableValue', () => {
  it('renders formatted display value', () => {
    render(
      <InlineEditableValue
        value={850}
        onCommit={vi.fn()}
        format={(v) => `${v} bbl/d`}
      />
    );
    expect(screen.getByText('850 bbl/d')).toBeTruthy();
  });

  it('clicking enters edit mode with input', () => {
    render(<InlineEditableValue value={850} onCommit={vi.fn()} />);
    fireEvent.click(screen.getByText('850'));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('850');
  });

  it('onFocus enters edit mode (Tab navigation)', () => {
    render(<InlineEditableValue value={100} onCommit={vi.fn()} />);
    fireEvent.focus(screen.getByText('100'));
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('blur commits value via onCommit', () => {
    const onCommit = vi.fn();
    render(<InlineEditableValue value={850} onCommit={onCommit} />);
    fireEvent.click(screen.getByText('850'));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '900' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith('900');
  });

  it('Enter commits value', () => {
    const onCommit = vi.fn();
    render(<InlineEditableValue value={850} onCommit={onCommit} />);
    fireEvent.click(screen.getByText('850'));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledWith('1000');
  });

  it('Escape cancels without calling onCommit', () => {
    const onCommit = vi.fn();
    render(<InlineEditableValue value={850} onCommit={onCommit} />);
    fireEvent.click(screen.getByText('850'));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onCommit).not.toHaveBeenCalled();
    // Should return to display mode
    expect(screen.getByText('850')).toBeTruthy();
  });

  it('validation error prevents commit and shows error message', () => {
    const onCommit = vi.fn();
    const validate = (raw: string) => {
      const n = Number(raw);
      return n <= 0 ? 'Must be positive' : null;
    };
    render(
      <InlineEditableValue value={850} onCommit={onCommit} validate={validate} />
    );
    fireEvent.click(screen.getByText('850'));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '-5' } });
    fireEvent.blur(input);
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByText('Must be positive')).toBeTruthy();
  });

  it('parse function transforms value before commit', () => {
    const onCommit = vi.fn();
    render(
      <InlineEditableValue
        value={850}
        onCommit={onCommit}
        parse={(raw) => parseFloat(raw)}
      />
    );
    fireEvent.click(screen.getByText('850'));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1234.5' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith('1234.5');
  });
});
