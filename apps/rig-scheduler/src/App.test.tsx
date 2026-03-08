import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

const editGridCell = async (testId: string, rowIndex: number, colId: string, nextValue: string) => {
  await waitFor(() => {
    expect(window.__rigPlannerGridApis?.[testId]).toBeDefined();
  });

  window.__rigPlannerGridApis?.[testId]
    .getDisplayedRowAtIndex(rowIndex)
    ?.setDataValue(colId as never, Number(nextValue) as never);
};

describe('Rig Planner Workbook UI', () => {
  it('preserves in-memory state when switching workbook sections', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTestId('section-tab-CONSTRAINTS'));
    const planningYears = screen.getByTestId('planning-years-input');

    fireEvent.change(planningYears, { target: { value: '6' } });

    await user.click(screen.getByTestId('section-tab-INVENTORY'));
    await user.click(screen.getByTestId('section-tab-CONSTRAINTS'));

    expect(screen.getByTestId('planning-years-input')).toHaveValue(6);
  });

  it('updates results after an inventory grid edit', async () => {
    const user = userEvent.setup();
    render(<App />);

    await editGridCell('inventory-grid', 0, 'inventoryCount', '1');

    await user.click(screen.getAllByTestId('section-tab-RESULTS')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('scheduled-wells-value')).toHaveTextContent('18');
    });
  });

  it('loads JSON through the utility drawer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Open utility drawer' })[0]);
    expect(screen.getByTestId('utility-drawer')).toBeInTheDocument();

    const jsonDraft = screen.getByTestId('json-draft') as HTMLTextAreaElement;
    const nextDraft = jsonDraft.value.replace('"mode": "AUTO"', '"mode": "MANUAL_YEAR"');
    fireEvent.change(jsonDraft, { target: { value: nextDraft } });

    await user.click(screen.getByRole('button', { name: 'Load JSON draft' }));

    await waitFor(() => {
      expect(screen.queryByTestId('utility-drawer')).not.toBeInTheDocument();
    });

    expect(screen.getByLabelText('Mode')).toHaveValue('MANUAL_YEAR');
  });
});
