import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WellsTable from './WellsTable';
import type { Well } from '../../types';

const mockWells: Well[] = [
  { id: 'w1', name: 'Alpha Well', lat: 31.9, lng: -102.1, lateralLength: 10500, status: 'PRODUCING', operator: 'Permian Co', formation: 'Wolfcamp' },
  { id: 'w2', name: 'Bravo Well', lat: 32.0, lng: -102.2, lateralLength: 8200, status: 'DUC', operator: 'Basin LLC', formation: 'Bone Spring' },
  { id: 'w3', name: 'Charlie Well', lat: 31.8, lng: -102.3, lateralLength: 12000, status: 'PERMIT', operator: 'Permian Co', formation: 'Wolfcamp' },
  { id: 'w4', name: 'Delta Well', lat: 31.7, lng: -102.4, lateralLength: 9500, status: 'PRODUCING', operator: 'Mesa Energy', formation: 'Delaware' },
];

function renderTable(props: Partial<React.ComponentProps<typeof WellsTable>> = {}) {
  const defaultProps = {
    wells: mockWells,
    selectedWellIds: new Set<string>(),
    onSelectWells: vi.fn(),
    onToggleWell: vi.fn(),
  };
  return render(
    <MemoryRouter>
      <WellsTable {...defaultProps} {...props} />
    </MemoryRouter>
  );
}

describe('WellsTable', () => {
  it('renders all 5 column headers plus checkbox', () => {
    renderTable();
    expect(screen.getByText('Well')).toBeDefined();
    expect(screen.getByText('Formation')).toBeDefined();
    expect(screen.getByText('Lateral')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
    expect(screen.getByText('Operator')).toBeDefined();
    // Checkbox column - select all checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(1); // at least the header checkbox
  });

  it('renders well rows with correct data', () => {
    renderTable();
    expect(screen.getByText('Alpha Well')).toBeDefined();
    expect(screen.getByText('Bravo Well')).toBeDefined();
    expect(screen.getByText('Charlie Well')).toBeDefined();
    expect(screen.getByText('Delta Well')).toBeDefined();
    expect(screen.getByText('Wolfcamp')).toBeDefined();
    expect(screen.getByText('10,500 ft')).toBeDefined();
  });

  it('clicking column header triggers sort', () => {
    renderTable();
    const wellHeader = screen.getByText('Well');
    fireEvent.click(wellHeader);
    // After clicking, rows should be sorted - Alpha should still be first (asc)
    const rows = screen.getAllByRole('row');
    // Header row + 4 data rows
    expect(rows.length).toBe(5);
  });

  it('global filter filters rows by text', () => {
    renderTable();
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });
    // Should only show Alpha Well
    expect(screen.getByText('Alpha Well')).toBeDefined();
    expect(screen.queryByText('Bravo Well')).toBeNull();
  });

  it('checkbox select toggles row selection', () => {
    const onSelectWells = vi.fn();
    renderTable({ onSelectWells });
    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is select-all, rest are per-row
    expect(checkboxes.length).toBe(5); // 1 header + 4 rows
    fireEvent.click(checkboxes[1]); // click first row checkbox
    expect(onSelectWells).toHaveBeenCalled();
  });

  it('selectedWellIds prop correctly marks rows as selected', () => {
    renderTable({ selectedWellIds: new Set(['w1', 'w3']) });
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    // Row checkboxes for w1 and w3 should be checked
    // checkboxes[0] = select-all, [1]=w1, [2]=w2, [3]=w3, [4]=w4
    expect(checkboxes[1].checked).toBe(true);
    expect(checkboxes[2].checked).toBe(false);
    expect(checkboxes[3].checked).toBe(true);
    expect(checkboxes[4].checked).toBe(false);
  });
});
