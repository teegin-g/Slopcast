import React from 'react';
import { useTheme } from '../../../theme/ThemeProvider';
import { useControlsStyles } from './useControlsStyles';

/**
 * Shared table shell for the economics control panels
 * (Capex / Opex / Ownership / DeclineSegment).
 *
 * Owns the duplicated chrome ONLY: the outer wrapper, the 12-column header row,
 * the scroll region, the per-row grid container + delete button, the empty
 * state, and the add-row footer. Each control supplies its own per-row cells
 * (which still contain the control-specific InlineEditableValue / select usages)
 * via the `renderCells` render-prop.
 *
 * The rendered DOM, className strings (including isClassic variants), column
 * layout, and add/delete/empty-state behavior are intentionally identical to
 * the previous per-file implementations — this is a structural de-duplication.
 */

export interface EditableItemTableColumn {
  /** Header label text (empty string for the trailing delete column header). */
  label: React.ReactNode;
  /** Tailwind col-span + alignment classes, e.g. "col-span-3" or "col-span-2 text-right". */
  className: string;
}

export interface EditableItemTableProps<T> {
  items: T[];
  /** Stable key for each row. */
  getKey: (item: T, index: number) => React.Key;
  /** Column definitions including the trailing (empty-label) delete column. */
  columns: EditableItemTableColumn[];
  /** Renders the data cells for a row (everything EXCEPT the trailing delete cell). */
  renderCells: (item: T, index: number) => React.ReactNode;
  /** Delete handler per row. Receives the item + index. */
  onDelete: (item: T, index: number) => void;
  /** Per-row aria-label for the delete button (optional). */
  deleteAriaLabel?: (item: T, index: number) => string | undefined;
  /**
   * When true for a given row, the delete button is rendered but hidden via
   * `invisible` (used by DeclineSegment when only one segment remains).
   */
  deleteDisabled?: (item: T, index: number) => boolean;
  /** Add-row handler. */
  onAdd: () => void;
  /** Add button label, e.g. "+ Add Cost Item". */
  addLabel: React.ReactNode;
  /** Right-aligned footer content (totals / hints / counts). */
  footerRight: React.ReactNode;
  /** Footer-right text size class. Defaults to "text-[10px]"; DeclineSegment uses "text-[9px]". */
  footerRightClass?: string;
  /** Empty-state content; when omitted, no empty state renders (DeclineSegment). */
  emptyState?: React.ReactNode;
  /** Header text size class. Defaults to "text-[10px]"; DeclineSegment uses "text-[9px]". */
  headerTextClass?: string;
  /** Scroll region max-height class. Defaults to "max-h-64"; DeclineSegment uses "max-h-48". */
  scrollMaxHeightClass?: string;
}

export function EditableItemTable<T>({
  items,
  getKey,
  columns,
  renderCells,
  onDelete,
  deleteAriaLabel,
  deleteDisabled,
  onAdd,
  addLabel,
  footerRight,
  footerRightClass = 'text-[10px] text-theme-muted',
  emptyState,
  headerTextClass = 'text-[10px]',
  scrollMaxHeightClass = 'max-h-64',
}: EditableItemTableProps<T>) {
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;
  const { headerClass, wrapperClass } = useControlsStyles(isClassic);

  return (
    <div className={`border rounded-inner overflow-hidden ${wrapperClass}`}>
      <div className={`grid grid-cols-12 gap-0 ${headerTextClass} font-bold text-theme-muted p-2 border-b ${headerClass}`}>
        {columns.map((col, i) => (
          <div key={i} className={col.className}>{col.label}</div>
        ))}
      </div>

      <div className={`${scrollMaxHeightClass} overflow-y-auto scrollbar-hide`}>
        {items.map((item, index) => {
          const disabled = deleteDisabled?.(item, index) ?? false;
          const ariaLabel = deleteAriaLabel?.(item, index);
          return (
            <div
              key={getKey(item, index)}
              className="grid grid-cols-12 gap-0 border-b border-theme-border text-[10px] items-center hover:bg-theme-surface1/30 group transition-colors"
            >
              {renderCells(item, index)}

              <div className="col-span-1 text-center">
                <button
                  type="button"
                  aria-label={ariaLabel}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onDelete(item, index);
                  }}
                  className={
                    disabled
                      ? 'text-theme-border hover:text-theme-danger w-4 h-4 rounded flex items-center justify-center transition-opacity invisible'
                      : deleteDisabled
                        ? 'text-theme-border hover:text-theme-danger w-4 h-4 rounded flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100'
                        : 'text-theme-border hover:text-theme-danger size-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
                  }
                >
                  &times;
                </button>
              </div>
            </div>
          );
        })}

        {emptyState != null && items.length === 0 && (
          <div className="p-4 text-center text-theme-muted text-[10px] italic">
            {emptyState}
          </div>
        )}
      </div>

      <div className={`p-2 flex justify-between items-center border-t ${headerClass}`}>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onAdd();
          }}
          className="text-[10px] text-theme-cyan hover:opacity-80 font-medium transition-colors"
        >
          {addLabel}
        </button>
        <div className={footerRightClass}>
          {footerRight}
        </div>
      </div>
    </div>
  );
}

export default EditableItemTable;
