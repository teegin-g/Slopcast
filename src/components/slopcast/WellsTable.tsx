import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import type { Well } from '../../types';
import { useTableFilters } from './hooks/useTableFilters';
import FilterChips from './FilterChips';

export interface WellsTableProps {
  wells: Well[];
  selectedWellIds: Set<string>;
  onSelectWells: (ids: string[]) => void;
  onToggleWell: (id: string) => void;
}

function formatFeet(value: number) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)} ft`;
}

const WellsTable: React.FC<WellsTableProps> = ({
  wells,
  selectedWellIds,
  onSelectWells,
  onToggleWell,
}) => {
  const {
    globalFilter,
    setGlobalFilter,
    columnFilters,
    setColumnFilters,
    activeFilters,
    removeFilter,
  } = useTableFilters('wells');

  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Derive rowSelection from external selectedWellIds
  const rowSelection: RowSelectionState = useMemo(() => {
    const sel: Record<string, boolean> = {};
    for (const id of selectedWellIds) {
      sel[id] = true;
    }
    return sel;
  }, [selectedWellIds]);

  // Extract unique values for dropdown filters
  const statusOptions = useMemo(() => {
    return Array.from(new Set(wells.map(w => w.status))).sort();
  }, [wells]);

  const formationOptions = useMemo(() => {
    return Array.from(new Set(wells.map(w => w.formation))).sort();
  }, [wells]);

  const columns = useMemo<ColumnDef<Well>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      size: 40,
      enableResizing: false,
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Well',
      size: 200,
    },
    {
      accessorKey: 'formation',
      header: 'Formation',
      size: 140,
    },
    {
      accessorKey: 'lateralLength',
      header: 'Lateral',
      cell: (info) => formatFeet(info.getValue() as number),
      size: 100,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
    },
    {
      accessorKey: 'operator',
      header: 'Operator',
      size: 160,
    },
  ], []);

  const table = useReactTable<Well>({
    data: wells,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      rowSelection,
    },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      const ids = Object.keys(next).filter(k => next[k]);
      onSelectWells(ids);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    enableRowSelection: true,
  });

  // Dropdown filter handlers
  const currentStatusFilter = columnFilters.find(f => f.id === 'status')?.value as string | undefined;
  const currentFormationFilter = columnFilters.find(f => f.id === 'formation')?.value as string | undefined;

  const handleStatusFilter = (value: string) => {
    setColumnFilters(prev => {
      const without = prev.filter(f => f.id !== 'status');
      if (value === 'ALL' || value === '') return without;
      return [...without, { id: 'status', value }];
    });
  };

  const handleFormationFilter = (value: string) => {
    setColumnFilters(prev => {
      const without = prev.filter(f => f.id !== 'formation');
      if (value === 'ALL' || value === '') return without;
      return [...without, { id: 'formation', value }];
    });
  };

  return (
    <div className="rounded-panel border shadow-card bg-theme-surface1/70 border-theme-border overflow-hidden">
      {/* Search and filter bar */}
      <div className="px-4 py-2 border-b border-theme-border/60 flex flex-col md:flex-row gap-2">
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Search wells..."
          className="flex-1 rounded-inner border border-theme-border bg-theme-bg px-2 py-1.5 text-[11px] text-theme-text placeholder:text-theme-muted"
        />
        <select
          value={currentStatusFilter ?? 'ALL'}
          onChange={e => handleStatusFilter(e.target.value)}
          className="rounded-inner border border-theme-border bg-theme-bg px-2 py-1.5 text-[11px] text-theme-text"
        >
          <option value="ALL">All Statuses</option>
          {statusOptions.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={currentFormationFilter ?? 'ALL'}
          onChange={e => handleFormationFilter(e.target.value)}
          className="rounded-inner border border-theme-border bg-theme-bg px-2 py-1.5 text-[11px] text-theme-text"
        >
          <option value="ALL">All Formations</option>
          {formationOptions.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Filter chips */}
      <FilterChips filters={activeFilters} onRemove={removeFilter} />

      {/* Table */}
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full table-fixed" style={{ width: table.getTotalSize() }}>
          <thead className="sticky top-0 z-10 bg-theme-surface1 border-b border-theme-border">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="py-2 px-2 text-left text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan relative"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' \u25B2',
                          desc: ' \u25BC',
                        }[header.column.getIsSorted() as string] ?? ''}
                      </div>
                    )}
                    {/* Resize handle */}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-theme-border/30 hover:bg-theme-cyan/50"
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="text-[11px] text-theme-text">
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className={`border-t border-theme-border/50 hover:bg-theme-surface2/30 ${
                  row.getIsSelected() ? 'bg-theme-cyan/10' : ''
                }`}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="py-1.5 px-2"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WellsTable;
