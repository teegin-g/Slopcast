import React, { useMemo, useState } from 'react';
import type { CapexAssumptions, CapexItem, CostBasis, CapexCategory } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { InlineEditableValue } from './inline/InlineEditableValue';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useStableChartContainer } from './slopcast/hooks/useStableChartContainer';
import { createLocalId } from '../utils/id';
import { EditableItemTable } from './slopcast/economics/EditableItemTable';
import { useControlsStyles } from './slopcast/economics/useControlsStyles';

interface CapexControlsProps {
  capex: CapexAssumptions;
  onChange: (updated: CapexAssumptions) => void;
}

const CATEGORIES: CapexCategory[] = ['DRILLING', 'COMPLETION', 'FACILITIES', 'EQUIPMENT', 'OTHER'];
const BASIS_OPTS: { label: string; value: CostBasis }[] = [
  { label: '$/Well', value: 'PER_WELL' },
  { label: '$/Ft', value: 'PER_FOOT' },
];

const CATEGORY_COLORS: Record<CapexCategory, string> = {
  DRILLING: '#3b82f6',
  COMPLETION: '#10b981',
  FACILITIES: '#f59e0b',
  EQUIPMENT: '#8b5cf6',
  OTHER: '#6b7280',
};

const STANDARD_LATERAL = 10000;

const CapexControls: React.FC<CapexControlsProps> = ({ capex, onChange }) => {
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;
  const [isEditing, setIsEditing] = useState(false);
  const capexChart = useStableChartContainer([theme.id, capex.items.length]);

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
      id: createLocalId('c'),
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

  const totalCost = useMemo(() => {
    let total = 0;
    capex.items.forEach(item => {
      const cost = item.basis === 'PER_FOOT' ? item.value * STANDARD_LATERAL : item.value;
      total += cost;
    });
    return total;
  }, [capex.items]);

  const categoryData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    capex.items.forEach(item => {
      const cost = item.basis === 'PER_FOOT' ? item.value * STANDARD_LATERAL : item.value;
      byCategory[item.category] = (byCategory[item.category] || 0) + cost;
    });
    return Object.entries(byCategory).reduce<{ name: string; value: number; color: string }[]>(
      (acc, [category, value]) => {
        if (value > 0) {
          acc.push({ name: category, value, color: CATEGORY_COLORS[category as CapexCategory] || '#6b7280' });
        }
        return acc;
      },
      []
    );
  }, [capex.items]);

  const { inlineValueClass, inlineInputClass } = useControlsStyles(isClassic);

  // --- PIE CHART SUMMARY VIEW ---
  if (!isEditing) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          className="cursor-pointer group w-full text-left"
          onClick={() => setIsEditing(true)}
        >
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="size-28 shrink-0" ref={capexChart.containerRef}>
                {capexChart.ready ? (
                  <ResponsiveContainer width={capexChart.width} height={capexChart.height}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={48}
                        strokeWidth={1}
                        stroke={isClassic ? 'rgba(0,0,0,0.3)' : 'var(--theme-border)'}
                      >
                        {categoryData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `$${(value / 1e6).toFixed(2)}MM`}
                        contentStyle={{
                          background: 'var(--theme-bg)',
                          border: '1px solid var(--theme-border)',
                          borderRadius: '6px',
                          fontSize: '10px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`h-full w-full rounded-full ${isClassic ? 'bg-black/20' : 'bg-theme-bg/40 animate-pulse'}`} />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className={`text-center mb-2 ${isClassic ? 'text-white' : 'text-theme-text'}`}>
                  <span className="text-lg font-black">${(totalCost / 1e6).toFixed(2)}</span>
                  <span className="text-[10px] font-bold text-theme-muted ml-1">MM D&C</span>
                </div>
                {categoryData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-[9px]">
                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className={`uppercase tracking-wider font-bold ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                      {d.name}
                    </span>
                    <span className={`ml-auto font-mono ${isClassic ? 'text-white' : 'text-theme-text'}`}>
                      ${(d.value / 1e6).toFixed(2)}M
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-theme-muted text-[10px] italic">
              No cost items defined.
            </div>
          )}
          <p className={`text-[9px] text-center mt-2 transition-opacity ${isClassic ? 'text-white/40 group-hover:text-white/70' : 'text-theme-muted/50 group-hover:text-theme-muted'}`}>
            Click to edit details
          </p>
        </button>
      </div>
    );
  }

  // --- EDITABLE GRID VIEW ---
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-bold text-theme-text">Line Items</h4>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className={`px-3 py-1 rounded-inner text-[9px] font-black uppercase tracking-[0.12em] border transition-all ${
            isClassic
              ? 'bg-black/15 text-white border-black/30 hover:bg-black/25'
              : 'bg-theme-bg text-theme-cyan border-theme-border hover:border-theme-cyan'
          }`}
        >
          Close editor
        </button>
      </div>

      <EditableItemTable
        items={capex.items}
        getKey={(item) => item.id}
        columns={[
          { label: 'ITEM', className: 'col-span-3' },
          { label: 'CATEGORY', className: 'col-span-2' },
          { label: 'COST', className: 'col-span-2 text-right' },
          { label: 'UNIT', className: 'col-span-2 text-center' },
          { label: 'OFFSET', className: 'col-span-2 text-right' },
          { label: '', className: 'col-span-1 text-center' },
        ]}
        onAdd={handleAddItem}
        addLabel="+ Add Cost Item"
        onDelete={(item) => handleDeleteItem(item.id)}
        deleteAriaLabel={(item) => `Delete ${item.name}`}
        emptyState="No cost items defined."
        footerRight={
          <>Total: <span className="text-theme-text font-mono font-medium">${(totalCost / 1e6).toFixed(2)}MM</span></>
        }
        renderCells={(item) => (
          <>
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
          </>
        )}
      />
    </div>
  );
};

export default CapexControls;
