import React, { useMemo, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ExpandedState,
} from '@tanstack/react-table';
import type { MonthlyCashFlow, CommodityPricingAssumptions } from '../../types';
import { buildAnnualRollups, formatAccounting, type AnnualCashFlowRow } from '../../utils/cashFlowRollup';
import { useTableFilters } from './hooks/useTableFilters';
import FilterChips from './FilterChips';

export interface CashFlowTableProps {
  flow: MonthlyCashFlow[];
  pricing: CommodityPricingAssumptions;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format a number with commas */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

/** Accounting cell renderer -- applies red text for negatives */
function AccountingCell({ value }: { value: number }) {
  const { text, negative } = formatAccounting(value);
  return <span className={negative ? 'text-red-400' : ''}>{text}</span>;
}

/**
 * Unified row type for annual and monthly rows.
 * Annual rows have year + subRows. Monthly rows have monthIndex.
 */
interface TableRow {
  id: string;
  period: string;
  oilProduction: number;
  gasProduction: number;
  oilRevenue: number;
  gasRevenue: number;
  opex: number;
  capex: number;
  taxes: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  year: number;
  subRows?: TableRow[];
}

function annualToTableRow(annual: AnnualCashFlowRow, pricing: CommodityPricingAssumptions): TableRow {
  return {
    id: `year-${annual.year}`,
    period: String(annual.year),
    oilProduction: annual.oilProduction,
    gasProduction: annual.gasProduction,
    oilRevenue: annual.oilRevenue,
    gasRevenue: annual.gasRevenue,
    opex: annual.opex,
    capex: annual.capex,
    taxes: annual.taxes,
    netCashFlow: annual.netCashFlow,
    cumulativeCashFlow: annual.cumulativeCashFlow,
    year: annual.year,
    subRows: annual.subRows.map((m, i) => monthToTableRow(m, pricing, annual.year, i)),
  };
}

function monthToTableRow(
  m: MonthlyCashFlow,
  pricing: CommodityPricingAssumptions,
  year: number,
  index: number,
): TableRow {
  const monthIdx = parseInt(m.date.slice(5, 7), 10) - 1;
  return {
    id: `month-${year}-${index}`,
    period: MONTH_NAMES[monthIdx] || `M${m.month}`,
    oilProduction: m.oilProduction,
    gasProduction: m.gasProduction,
    oilRevenue: m.oilProduction * pricing.oilPrice,
    gasRevenue: m.gasProduction * pricing.gasPrice,
    opex: m.opex,
    capex: m.capex,
    taxes: (m.severanceTax ?? 0) + (m.adValoremTax ?? 0),
    netCashFlow: m.netCashFlow,
    cumulativeCashFlow: m.cumulativeCashFlow,
    year,
  };
}

const CashFlowTable: React.FC<CashFlowTableProps> = ({ flow, pricing }) => {
  const {
    columnFilters,
    setColumnFilters,
    activeFilters,
    removeFilter,
  } = useTableFilters('cashflow');

  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const annuals = useMemo(() => buildAnnualRollups(flow, pricing), [flow, pricing]);

  // Derive available years for filter
  const yearOptions = useMemo(() => annuals.map(a => a.year), [annuals]);

  // Year range filter state (from columnFilters)
  const currentYearFilter = columnFilters.find(f => f.id === 'year')?.value as string | undefined;

  const handleYearFilter = useCallback((value: string) => {
    setColumnFilters(prev => {
      const without = prev.filter(f => f.id !== 'year');
      if (value === 'ALL' || value === '') return without;
      return [...without, { id: 'year', value }];
    });
  }, [setColumnFilters]);

  // Build table data
  const data = useMemo<TableRow[]>(() => {
    return annuals.map(a => annualToTableRow(a, pricing));
  }, [annuals, pricing]);

  const columns = useMemo<ColumnDef<TableRow>[]>(() => [
    {
      accessorKey: 'period',
      header: 'Period',
      cell: ({ row, getValue }) => {
        const isAnnual = row.depth === 0;
        return (
          <div className={`flex items-center gap-1.5 ${!isAnnual ? 'pl-5' : ''}`}>
            {isAnnual && row.getCanExpand() && (
              <button
                type="button"
                onClick={row.getToggleExpandedHandler()}
                className="text-[10px] text-theme-muted hover:text-theme-text transition-colors"
                aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
              >
                {row.getIsExpanded() ? '\u25BC' : '\u25B6'}
              </button>
            )}
            <span>{getValue() as string}</span>
          </div>
        );
      },
      size: 100,
      enableSorting: false,
    },
    {
      accessorKey: 'oilProduction',
      header: 'Oil (bbl)',
      cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue() as number)}</span>,
      size: 100,
    },
    {
      accessorKey: 'gasProduction',
      header: 'Gas (mcf)',
      cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue() as number)}</span>,
      size: 100,
    },
    {
      accessorKey: 'oilRevenue',
      header: 'Oil Rev',
      cell: ({ getValue }) => <span className="tabular-nums"><AccountingCell value={getValue() as number} /></span>,
      size: 110,
    },
    {
      accessorKey: 'gasRevenue',
      header: 'Gas Rev',
      cell: ({ getValue }) => <span className="tabular-nums"><AccountingCell value={getValue() as number} /></span>,
      size: 110,
    },
    {
      accessorKey: 'opex',
      header: 'LOE',
      cell: ({ getValue }) => <span className="tabular-nums"><AccountingCell value={getValue() as number} /></span>,
      size: 100,
    },
    {
      accessorKey: 'capex',
      header: 'CAPEX',
      cell: ({ getValue }) => <span className="tabular-nums"><AccountingCell value={getValue() as number} /></span>,
      size: 110,
    },
    {
      accessorKey: 'taxes',
      header: 'Taxes',
      cell: ({ getValue }) => <span className="tabular-nums"><AccountingCell value={getValue() as number} /></span>,
      size: 100,
    },
    {
      accessorKey: 'netCashFlow',
      header: 'Net CF',
      cell: ({ getValue }) => <span className="tabular-nums"><AccountingCell value={getValue() as number} /></span>,
      size: 110,
    },
    {
      accessorKey: 'cumulativeCashFlow',
      header: 'Cumulative',
      cell: ({ getValue }) => <span className="tabular-nums"><AccountingCell value={getValue() as number} /></span>,
      size: 120,
    },
  ], []);

  // Custom filter function for year column
  const yearFilterFn = useCallback((row: { original: TableRow }, _columnId: string, filterValue: string) => {
    return String(row.original.year) === filterValue;
  }, []);

  const table = useReactTable<TableRow>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      expanded,
    },
    getRowId: (row) => row.id,
    getSubRows: (row) => row.subRows,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    filterFns: {
      yearFilter: yearFilterFn,
    },
  });

  if (flow.length === 0) {
    return (
      <div className="rounded-panel border shadow-card bg-theme-surface1/70 border-theme-border p-8 text-center">
        <p className="text-theme-muted text-sm">No cash flow data available. Run economics to generate projections.</p>
      </div>
    );
  }

  return (
    <div className="rounded-panel border shadow-card bg-theme-surface1/70 border-theme-border overflow-hidden">
      {/* Year filter bar */}
      <div className="px-4 py-2 border-b border-theme-border/60 flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan">
          Cash Flow
        </span>
        <div className="ml-auto">
          <select
            value={currentYearFilter ?? 'ALL'}
            onChange={e => handleYearFilter(e.target.value)}
            className="rounded-inner border border-theme-border bg-theme-bg px-2 py-1.5 text-[11px] text-theme-text"
          >
            <option value="ALL">All Years</option>
            {yearOptions.map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter chips */}
      <FilterChips filters={activeFilters} onRemove={removeFilter} />

      {/* Table */}
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full" style={{ minWidth: table.getTotalSize() }}>
          <thead className="sticky top-0 z-10 bg-theme-surface1 border-b border-theme-border">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="py-2 px-2 text-left text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan"
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
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="text-[11px] text-theme-text">
            {table.getRowModel().rows.map(row => {
              const isAnnual = row.depth === 0;
              return (
                <tr
                  key={row.id}
                  className={`border-t border-theme-border/50 ${
                    isAnnual
                      ? 'font-semibold bg-theme-surface2/20 hover:bg-theme-surface2/40'
                      : 'hover:bg-theme-surface2/20'
                  }`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="py-1 px-2"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashFlowTable;
