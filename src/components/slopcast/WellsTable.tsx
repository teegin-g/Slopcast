import React, { useMemo, useState } from 'react';
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
}) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const rowSelection: RowSelectionState = useMemo(() => {
    const selected: Record<string, boolean> = {};
    for (const id of selectedWellIds) {
      selected[id] = true;
    }
    return selected;
  }, [selectedWellIds]);

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
      rowSelection,
    },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      const ids = Object.keys(next).filter((id) => next[id]);
      onSelectWells(ids);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    enableRowSelection: true,
  });

  const visibleRows = table.getRowModel().rows.length;

  return (
    <div className="rounded-panel border shadow-card bg-theme-surface1/70 border-theme-border overflow-hidden">
      <div className="px-4 py-2 border-b border-theme-border/60 flex flex-col md:flex-row md:items-center gap-2">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search wells..."
          className="flex-1 rounded-inner border border-theme-border bg-theme-bg px-2 py-1.5 text-[11px] text-theme-text placeholder:text-theme-muted"
        />
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-theme-muted">
          {visibleRows} well{visibleRows === 1 ? '' : 's'}
        </div>
      </div>

      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full table-fixed" style={{ width: table.getTotalSize() }}>
          <thead className="sticky top-0 z-10 bg-theme-surface1 border-b border-theme-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-[11px] text-theme-muted">
                  No wells match the current search.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-t border-theme-border/50 hover:bg-theme-surface2/30 ${
                    row.getIsSelected() ? 'bg-theme-cyan/10' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="py-1.5 px-2"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WellsTable;
