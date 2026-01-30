
import { Well, TypeCurveParams, CapexAssumptions, CapexItem, PricingAssumptions } from './types';

// Generate some mock wells in a basin-like cluster
const generateWells = (count: number): Well[] => {
  const wells: Well[] = [];
  const centerLat = 31.9;
  const centerLng = -102.3;
  
  for (let i = 0; i < count; i++) {
    wells.push({
      id: `w-${i}`,
      name: `Maverick ${i + 1}H`,
      lat: centerLat + (Math.random() - 0.5) * 0.15,
      lng: centerLng + (Math.random() - 0.5) * 0.2,
      lateralLength: Math.random() > 0.5 ? 10000 : 7500,
      status: Math.random() > 0.7 ? 'DUC' : 'PERMIT',
      operator: 'Strata Ops LLC',
    });
  }
  return wells;
};

export const MOCK_WELLS: Well[] = generateWells(40);

export const DEFAULT_TYPE_CURVE: TypeCurveParams = {
  qi: 850,
  b: 1.2,
  di: 65, // 65% initial decline
  terminalDecline: 8,
};

const DEFAULT_CAPEX_ITEMS: CapexItem[] = [
    { id: 'c-1', name: 'Location/Roads', category: 'FACILITIES', value: 85000, basis: 'PER_WELL', offsetDays: -15 },
    { id: 'c-2', name: 'Rig Mob/Demob', category: 'DRILLING', value: 45000, basis: 'PER_WELL', offsetDays: 0 },
    { id: 'c-3', name: 'Drilling - Tangibles', category: 'DRILLING', value: 125, basis: 'PER_FOOT', offsetDays: 10 },
    { id: 'c-4', name: 'Drilling - Intangibles', category: 'DRILLING', value: 350, basis: 'PER_FOOT', offsetDays: 10 },
    { id: 'c-5', name: 'Cement & Services', category: 'DRILLING', value: 120000, basis: 'PER_WELL', offsetDays: 15 },
    { id: 'c-6', name: 'Frac / Stimulation', category: 'COMPLETION', value: 650, basis: 'PER_FOOT', offsetDays: 45 },
    { id: 'c-7', name: 'Water Transfer/Disp', category: 'COMPLETION', value: 200000, basis: 'PER_WELL', offsetDays: 50 },
    { id: 'c-8', name: 'Tank Battery/Facilities', category: 'FACILITIES', value: 450000, basis: 'PER_WELL', offsetDays: 80 },
    { id: 'c-9', name: 'Tubing & Lift Equip', category: 'EQUIPMENT', value: 110000, basis: 'PER_WELL', offsetDays: 90 },
];

export const DEFAULT_CAPEX: CapexAssumptions = {
  rigCount: 2,
  drillDurationDays: 18,
  stimDurationDays: 12,
  rigStartDate: new Date().toISOString().split('T')[0],
  items: DEFAULT_CAPEX_ITEMS,
};

export const DEFAULT_PRICING: PricingAssumptions = {
  oilPrice: 75.00,
  gasPrice: 3.25,
  oilDifferential: 2.50,
  gasDifferential: 0.35,
  nri: 0.75, // 75% NRI
  loePerMonth: 8500,
};

export const GROUP_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];
