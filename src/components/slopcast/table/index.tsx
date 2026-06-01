/**
 * Shared TanStack table primitives used by WellsTable and CashFlowTable.
 *
 * - SortableHeader  — renders a sort button or plain span for a column header
 * - ResizeHandle    — drag handle for column resizing
 * - tableRowClass   — builds a row className from a base + conditional extras
 */

import React from 'react';
import { flexRender, type Header } from '@tanstack/react-table';

// ── SortableHeader ──────────────────────────────────────────────────────────

export interface SortableHeaderProps<TData> {
  header: Header<TData, unknown>;
  /**
   * aria-label for the sort button.
   * - Pass a string to set an explicit label.
   * - Omit to use the default: `"Sort by <column header>"`.
   * - Pass `false` to omit the aria-label attribute entirely (preserving
   *   pre-existing markup in tables that never had one).
   */
  ariaLabel?: string | false;
}

/**
 * Renders a clickable button when the column is sortable, otherwise a plain
 * span. Appends ▲ / ▼ to indicate sort direction. The column header content
 * is rendered with flexRender so it works with both string and render-function
 * column definitions.
 */
export function SortableHeader<TData>({ header, ariaLabel }: SortableHeaderProps<TData>) {
  if (header.isPlaceholder) return null;

  if (header.column.getCanSort()) {
    const sortIndicator = ({
      asc: ' ▲',
      desc: ' ▼',
    } as Record<string, string>)[header.column.getIsSorted() as string] ?? '';

    const resolvedAriaLabel =
      ariaLabel === false
        ? undefined
        : ariaLabel ?? `Sort by ${String(header.column.columnDef.header)}`;

    return (
      <button
        type="button"
        aria-label={resolvedAriaLabel}
        className="cursor-pointer select-none bg-transparent border-0 p-0 text-inherit font-inherit w-full text-left"
        onClick={header.column.getToggleSortingHandler()}
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
        {sortIndicator}
      </button>
    );
  }

  return <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>;
}

// ── ResizeHandle ────────────────────────────────────────────────────────────

export interface ResizeHandleProps<TData> {
  header: Header<TData, unknown>;
}

/**
 * Column resize drag handle. Rendered only when `header.column.getCanResize()`
 * is true. Attach inside a `relative`-positioned `<th>`.
 */
export function ResizeHandle<TData>({ header }: ResizeHandleProps<TData>) {
  if (!header.column.getCanResize()) return null;

  return (
    <div
      role="separator"
      aria-label="Resize column"
      tabIndex={0}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-theme-border/30 hover:bg-theme-cyan/50"
    />
  );
}

// ── tableRowClass ───────────────────────────────────────────────────────────

/**
 * Returns a className string for a table row. Always includes the shared
 * border base (`border-t border-theme-border/50`). Pass additional class
 * strings as extras — hover variants, selection highlights, weight, etc.
 * Falsy values are ignored.
 *
 * The hover class is intentionally NOT baked in because WellsTable uses
 * `hover:bg-theme-surface2/30` while CashFlowTable uses `/20` for monthly
 * rows and `/40` for annual rows.
 *
 * @example
 * // WellsTable — selection highlight + hover
 * tableRowClass(
 *   'hover:bg-theme-surface2/30',
 *   row.getIsSelected() && 'bg-theme-cyan/10',
 * )
 *
 * @example
 * // CashFlowTable — annual vs. monthly styling
 * tableRowClass(
 *   isAnnual
 *     ? 'font-semibold bg-theme-surface2/20 hover:bg-theme-surface2/40'
 *     : 'hover:bg-theme-surface2/20'
 * )
 */
export function tableRowClass(...extras: (string | false | null | undefined)[]): string {
  const base = 'border-t border-theme-border/50';
  const extra = extras.filter(Boolean).join(' ');
  return extra ? `${base} ${extra}` : base;
}
