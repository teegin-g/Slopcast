import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { MonthlyCashFlow } from '../../types';

export interface ForecastGridProps {
  isClassic: boolean;
  flow: MonthlyCashFlow[];
  onUpdateFlow?: (updatedFlow: MonthlyCashFlow[]) => void;
  readOnly?: boolean;
}

type EditableField = 'oilProduction' | 'gasProduction' | 'capex' | 'opex';

const COLUMNS: Array<{ key: string; label: string; editable: boolean; align: 'left' | 'right' }> = [
  { key: 'month', label: 'Month', editable: false, align: 'right' },
  { key: 'date', label: 'Date', editable: false, align: 'left' },
  { key: 'oilProduction', label: 'Oil (bbl)', editable: true, align: 'right' },
  { key: 'gasProduction', label: 'Gas (mcf)', editable: true, align: 'right' },
  { key: 'revenue', label: 'Revenue ($)', editable: false, align: 'right' },
  { key: 'capex', label: 'CAPEX ($)', editable: true, align: 'right' },
  { key: 'opex', label: 'OPEX ($)', editable: true, align: 'right' },
  { key: 'netCashFlow', label: 'Net CF ($)', editable: false, align: 'right' },
  { key: 'cumulativeCashFlow', label: 'Cum CF ($)', editable: false, align: 'right' },
];

const EDITABLE_KEYS: EditableField[] = ['oilProduction', 'gasProduction', 'capex', 'opex'];

function fmt(val: number): string {
  return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

const ForecastGrid: React.FC<ForecastGridProps> = ({ isClassic, flow, onUpdateFlow, readOnly = false }) => {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const isEditable = (colIdx: number) => !readOnly && COLUMNS[colIdx].editable;

  const startEdit = useCallback((row: number, col: number) => {
    if (!isEditable(col)) return;
    const field = COLUMNS[col].key as EditableField;
    setEditingCell({ row, col });
    setEditValue(String(flow[row][field]));
  }, [flow, readOnly]);

  const commitEdit = useCallback(() => {
    if (!editingCell || !onUpdateFlow) return;
    const { row, col } = editingCell;
    const field = COLUMNS[col].key as EditableField;
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      const updated = flow.map((f, i) => (i === row ? { ...f, [field]: parsed } : f));
      onUpdateFlow(updated);
    }
    setEditingCell(null);
  }, [editingCell, editValue, flow, onUpdateFlow]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const moveSelection = useCallback((dRow: number, dCol: number) => {
    setSelectedCell(prev => {
      if (!prev) return prev;
      const nextRow = Math.max(0, Math.min(flow.length - 1, prev.row + dRow));
      const nextCol = Math.max(0, Math.min(COLUMNS.length - 1, prev.col + dCol));
      return { row: nextRow, col: nextCol };
    });
  }, [flow.length]);

  const fillDown = useCallback(() => {
    if (!selectedCell || !onUpdateFlow || readOnly) return;
    const { row, col } = selectedCell;
    if (!COLUMNS[col].editable) return;
    const field = COLUMNS[col].key as EditableField;
    const value = flow[row][field];
    const updated = flow.map((f, i) => (i > row ? { ...f, [field]: value } : f));
    onUpdateFlow(updated);
  }, [selectedCell, flow, onUpdateFlow, readOnly]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
      else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        moveSelection(0, e.shiftKey ? -1 : 1);
      }
      return;
    }
    if (!selectedCell) return;
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); moveSelection(-1, 0); break;
      case 'ArrowDown': e.preventDefault(); moveSelection(1, 0); break;
      case 'ArrowLeft': e.preventDefault(); moveSelection(0, -1); break;
      case 'ArrowRight': e.preventDefault(); moveSelection(0, 1); break;
      case 'Enter':
        e.preventDefault();
        startEdit(selectedCell.row, selectedCell.col);
        break;
      case 'Tab':
        e.preventDefault();
        moveSelection(0, e.shiftKey ? -1 : 1);
        break;
      case 'd':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          fillDown();
        }
        break;
    }
  }, [editingCell, selectedCell, commitEdit, cancelEdit, moveSelection, startEdit, fillDown]);

  const cellValue = (row: MonthlyCashFlow, key: string): string => {
    if (key === 'date') return row.date;
    const val = row[key as keyof MonthlyCashFlow] as number;
    return fmt(val);
  };

  // Theme classes
  const wrapperCls = isClassic
    ? 'sc-panel theme-transition overflow-hidden'
    : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border overflow-hidden';

  const headerBarCls = isClassic
    ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-2'
    : 'px-4 py-2 border-b border-theme-border/60';

  const titleCls = isClassic
    ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white'
    : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan';

  const thCls = (align: string) =>
    `px-3 py-2 text-${align} text-[9px] font-black uppercase tracking-[0.14em] whitespace-nowrap ${
      isClassic ? 'text-white/60 bg-black/40' : 'text-theme-muted bg-theme-bg'
    }`;

  const cellCls = (rowIdx: number, colIdx: number, align: string) => {
    const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
    const isEven = rowIdx % 2 === 0;
    const base = `px-3 py-1.5 text-[11px] tabular-nums text-${align} cursor-default transition-colors`;
    const stripe = isClassic
      ? isEven ? 'bg-transparent' : 'bg-white/[0.03]'
      : isEven ? 'bg-transparent' : 'bg-theme-surface2/30';
    const textColor = isClassic ? 'text-white' : 'text-theme-text';
    const border = isSelected ? 'outline outline-2 outline-offset-[-2px] outline-cyan-400' : '';
    const editableHint = isEditable(colIdx) && !readOnly ? 'cursor-cell' : '';
    return `${base} ${stripe} ${textColor} ${border} ${editableHint}`;
  };

  return (
    <div className={wrapperCls}>
      <div className={headerBarCls}>
        <div className="flex items-center justify-between">
          <span className={titleCls}>Forecast Grid</span>
          {!readOnly && (
            <span className={`text-[9px] ${isClassic ? 'text-white/40' : 'text-theme-muted/60'}`}>
              Ctrl+D fill down
            </span>
          )}
        </div>
      </div>
      <div
        ref={tableRef}
        className="overflow-auto max-h-[480px]"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              {COLUMNS.map(col => (
                <th key={col.key} className={thCls(col.align)}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flow.map((row, ri) => (
              <tr
                key={row.month}
                className={`border-b ${isClassic ? 'border-white/5' : 'border-theme-border/20'}`}
              >
                {COLUMNS.map((col, ci) => {
                  const isEditing = editingCell?.row === ri && editingCell?.col === ci;
                  return (
                    <td
                      key={col.key}
                      className={cellCls(ri, ci, col.align)}
                      onClick={() => setSelectedCell({ row: ri, col: ci })}
                      onDoubleClick={() => startEdit(ri, ci)}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          className={`w-full bg-transparent outline-none text-[11px] tabular-nums text-${col.align} ${
                            isClassic ? 'text-white' : 'text-theme-text'
                          }`}
                        />
                      ) : (
                        cellValue(row, col.key)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ForecastGrid;
