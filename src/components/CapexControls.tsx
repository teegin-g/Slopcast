import React, { useMemo } from 'react';
import { CapexAssumptions, CapexItem, CostBasis, CapexCategory } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { InlineEditableValue } from './inline/InlineEditableValue';

interface CapexControlsProps {
  capex: CapexAssumptions;
  onChange: (updated: CapexAssumptions) => void;
}

const CATEGORIES: CapexCategory[] = ['DRILLING', 'COMPLETION', 'FACILITIES', 'EQUIPMENT', 'OTHER'];
const BASIS_OPTS: { label: string; value: CostBasis }[] = [
  { label: '$/Well', value: 'PER_WELL' },
  { label: '$/Ft', value: 'PER_FOOT' },
];

const CapexControls: React.FC<CapexControlsProps> = ({ capex, onChange }) => {
  const { theme } = useTheme();
  const isClassic = theme.id === 'mario';

  const handleUpdateItem = (id: string, field: keyof CapexItem, value: any) => {
    const newItems = capex.items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange({ ...capex, items: newItems });
  };

  const handleAddItem = () => {
    const newItem: CapexItem = {
      id: `c-${Date.now()}`,
      name: 'New Item',
      category: 'OTHER',
      value: 0,
      basis: 'PER_WELL',
      offsetDays: 0
    };
    onChange({ ...capex, items: [...capex.items, newItem] });
  };

  const handleDeleteItem = (id: string) => {
    onChange({ ...capex, items: capex.items.filter(i => i.id !== id) });
  };

  const STANDARD_LATERAL = 10000;

  const totalCost = useMemo(() => {
    let total = 0;
    capex.items.forEach(item => {
      const cost = item.basis === 'PER_FOOT' ? item.value * STANDARD_LATERAL : item.value;
      total += cost;
    });
    return total;
  }, [capex.items]);

  const inlineValueClass = isClassic ? 'text-[10px] font-black text-white' : 'text-[10px] font-mono text-theme-text';
  const inlineInputClass = 'text-[10px] w-full';

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-bold text-theme-text">Line Items</h4>
      </div>

      {/* Grid Table -- always editable */}
      <div className={`border rounded-inner overflow-hidden ${isClassic ? 'border-black/30 bg-black/10' : 'border-theme-border bg-theme-bg'}`}>
        <div className={`grid grid-cols-12 gap-0 text-[10px] font-bold text-theme-muted p-2 border-b ${isClassic ? 'bg-black/10 border-black/30' : 'bg-theme-bg border-theme-border'}`}>
          <div className="col-span-3">ITEM</div>
          <div className="col-span-2">CATEGORY</div>
          <div className="col-span-2 text-right">COST</div>
          <div className="col-span-2 text-center">UNIT</div>
          <div className="col-span-2 text-right">OFFSET</div>
          <div className="col-span-1 text-center"></div>
        </div>

        <div className="max-h-64 overflow-y-auto scrollbar-hide">
          {capex.items.map(item => (
            <div key={item.id} className="grid grid-cols-12 gap-0 border-b border-theme-border text-[10px] items-center hover:bg-theme-surface1/30 group transition-colors">
              <div className="col-span-3 p-1">
                <InlineEditableValue
                  value={item.name}
                  onCommit={(v) => handleUpdateItem(item.id, 'name', v)}
                  type="text"
                  className={isClassic ? 'text-[10px] text-white/80' : 'text-[10px] text-theme-muted'}
                  inputClassName={inlineInputClass}
                />
              </div>

              <div className="col-span-2 p-1">
                <select
                  value={item.category}
                  onChange={e => handleUpdateItem(item.id, 'category', e.target.value)}
                  className="w-full bg-transparent text-theme-muted text-[9px] outline-none cursor-pointer hover:text-theme-text appearance-none"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="col-span-2 p-1">
                <InlineEditableValue
                  value={item.value}
                  onCommit={(v) => handleUpdateItem(item.id, 'value', parseFloat(v) || 0)}
                  format={(v) => `$${Number(v).toLocaleString()}`}
                  type="number"
                  validate={(raw) => {
                    const n = parseFloat(raw);
                    if (isNaN(n) || n < 0) return 'Must be >= 0';
                    return null;
                  }}
                  className={`${inlineValueClass} text-right`}
                  inputClassName={`${inlineInputClass} text-right`}
                />
              </div>

              <div className="col-span-2 p-1">
                <select
                  value={item.basis}
                  onChange={e => handleUpdateItem(item.id, 'basis', e.target.value)}
                  className="w-full bg-transparent text-theme-muted text-[9px] text-center outline-none cursor-pointer hover:text-theme-text appearance-none"
                >
                  {BASIS_OPTS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>

              <div className="col-span-2 p-1">
                <InlineEditableValue
                  value={item.offsetDays}
                  onCommit={(v) => handleUpdateItem(item.id, 'offsetDays', parseInt(v, 10) || 0)}
                  format={(v) => `${v}d`}
                  type="number"
                  validate={(raw) => {
                    const n = parseInt(raw, 10);
                    if (isNaN(n) || n < 0) return 'Must be >= 0';
                    return null;
                  }}
                  className={`${inlineValueClass} text-right`}
                  inputClassName={`${inlineInputClass} text-right`}
                />
              </div>

              <div className="col-span-1 text-center">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleDeleteItem(item.id);
                  }}
                  className="text-theme-border hover:text-theme-danger w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
          {capex.items.length === 0 && (
            <div className="p-4 text-center text-theme-muted text-[10px] italic">
              No cost items defined.
            </div>
          )}
        </div>

        <div className={`p-2 flex justify-between items-center border-t ${isClassic ? 'bg-black/10 border-black/30' : 'bg-theme-bg border-theme-border'}`}>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleAddItem();
            }}
            className="text-[10px] text-theme-cyan hover:opacity-80 font-medium transition-colors"
          >
            + Add Cost Item
          </button>
          <div className="text-[10px] text-theme-muted">
            Total: <span className="text-theme-text font-mono font-medium">${(totalCost / 1e6).toFixed(2)}MM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapexControls;
