import React, { useMemo, useState } from 'react';
import { CapexAssumptions, CapexItem, CostBasis, CapexCategory } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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
  'DRILLING': '#3b82f6',   // Blue
  'COMPLETION': '#8b5cf6', // Violet
  'FACILITIES': '#10b981', // Emerald
  'EQUIPMENT': '#f59e0b',  // Amber
  'OTHER': '#64748b'       // Slate
};

const CapexControls: React.FC<CapexControlsProps> = ({ capex, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);

  // --- Handlers ---
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

  // --- Calculations for Visualization ---
  // Estimate total for a standard 10,000' well
  const STANDARD_LATERAL = 10000;

  const { totalCost, categoryData } = useMemo(() => {
    const data: Record<CapexCategory, number> = {
        'DRILLING': 0,
        'COMPLETION': 0,
        'FACILITIES': 0,
        'EQUIPMENT': 0,
        'OTHER': 0
    };
    
    let total = 0;

    capex.items.forEach(item => {
        const cost = item.basis === 'PER_FOOT' ? item.value * STANDARD_LATERAL : item.value;
        if (data[item.category] !== undefined) {
            data[item.category] += cost;
        } else {
             data['OTHER'] += cost;
        }
        total += cost;
    });

    const chartData = Object.entries(data)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
            name: name as CapexCategory,
            value: value
        }));

    return { totalCost: total, categoryData: chartData };
  }, [capex.items]);


  // --- Render: Summary View (Default) ---
  if (!isEditing) {
      return (
          <div className="space-y-4">
              <div 
                onClick={() => setIsEditing(true)}
                className="group cursor-pointer bg-slate-900/50 rounded-lg border border-slate-800 p-4 hover:border-slate-700 transition-all relative"
              >
                  {/* Total Overlay */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Est. D&C</p>
                      <p className="text-xl font-bold text-slate-200">${(totalCost / 1e6).toFixed(1)}MM</p>
                  </div>

                  <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                              >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#cbd5e1', fontSize: '10px' }}
                                formatter={(value: number) => [`$${(value/1e6).toFixed(2)}MM`, '']}
                                itemStyle={{ padding: 0 }}
                              />
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
                  
                  <div className="text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 w-full left-0">
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider bg-slate-900 px-2 py-1 rounded-full border border-blue-900">
                          Click to Edit Details
                      </span>
                  </div>
              </div>

              {/* Mini Legend List */}
              <div className="space-y-2">
                  {categoryData.map(d => (
                      <div key={d.name} className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[d.name] }}></div>
                              <span className="text-slate-400 capitalize">{d.name.toLowerCase()}</span>
                          </div>
                          <span className="text-slate-200 font-mono">${(d.value / 1e6).toFixed(2)}MM</span>
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  // --- Render: Edit View (Expanded) ---
  return (
    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-bold text-slate-300">Detailed Line Items</h4>
          <button 
            onClick={() => setIsEditing(false)}
            className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded font-bold uppercase tracking-wide transition-colors"
          >
            Done
          </button>
      </div>

      {/* Grid Table */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
        <div className="grid grid-cols-12 gap-0 bg-slate-900 text-[10px] font-bold text-slate-500 p-2 border-b border-slate-800">
          <div className="col-span-4">ITEM</div>
          <div className="col-span-3">CATEGORY</div>
          <div className="col-span-2 text-right">COST</div>
          <div className="col-span-2 text-center">UNIT</div>
          <div className="col-span-1 text-center"></div>
        </div>
        
        <div className="max-h-64 overflow-y-auto scrollbar-hide">
          {capex.items.map(item => (
            <div key={item.id} className="grid grid-cols-12 gap-0 border-b border-slate-800 text-[10px] items-center hover:bg-slate-800/30 group transition-colors">
              {/* Name */}
              <div className="col-span-4 p-1">
                <input 
                  type="text" 
                  value={item.name}
                  onChange={e => handleUpdateItem(item.id, 'name', e.target.value)}
                  className="w-full bg-transparent text-slate-400 focus:text-slate-200 focus:bg-slate-800/50 px-1 rounded outline-none placeholder-slate-600"
                  placeholder="Item Name"
                />
              </div>
              
              {/* Category */}
              <div className="col-span-3 p-1">
                 <select 
                   value={item.category}
                   onChange={e => handleUpdateItem(item.id, 'category', e.target.value)}
                   className="w-full bg-transparent text-slate-500 text-[9px] outline-none cursor-pointer hover:text-slate-300 appearance-none"
                 >
                   {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>

              {/* Cost Value */}
              <div className="col-span-2 p-1">
                <input 
                  type="number" 
                  value={item.value}
                  onChange={e => handleUpdateItem(item.id, 'value', parseFloat(e.target.value))}
                  className="w-full bg-transparent text-slate-300 text-right focus:bg-slate-800/50 px-1 rounded outline-none font-mono"
                />
              </div>

              {/* Basis Dropdown */}
              <div className="col-span-2 p-1">
                <select 
                   value={item.basis}
                   onChange={e => handleUpdateItem(item.id, 'basis', e.target.value)}
                   className="w-full bg-transparent text-slate-500 text-[9px] text-center outline-none cursor-pointer hover:text-slate-300 appearance-none"
                 >
                   {BASIS_OPTS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                 </select>
              </div>

              {/* Delete */}
              <div className="col-span-1 text-center">
                 <button 
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-slate-700 hover:text-red-400 w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   &times;
                 </button>
              </div>
            </div>
          ))}
          {capex.items.length === 0 && (
            <div className="p-4 text-center text-slate-600 text-[10px] italic">
                No cost items defined.
            </div>
          )}
        </div>
        
        <div className="bg-slate-900 p-2 flex justify-between items-center border-t border-slate-800">
          <button onClick={handleAddItem} className="text-[10px] text-blue-500 hover:text-blue-400 font-medium transition-colors">
            + Add Cost Item
          </button>
          <div className="text-[10px] text-slate-600">
             Total: <span className="text-slate-400 font-mono font-medium">${(totalCost / 1e6).toFixed(2)}MM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapexControls;
