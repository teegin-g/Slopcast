import { TypeCurveParams, CapexAssumptions, CapexItem } from '../types';

export interface AssumptionTemplate {
  id: string;
  name: string;
  description: string;
  typeCurve: TypeCurveParams;
  capexItems: CapexItem[];
}

const WOLFCAMP_A_CAPEX: CapexItem[] = [
  { id: 't-wca-1', name: 'Location/Roads', category: 'FACILITIES', value: 95000, basis: 'PER_WELL', offsetDays: -15 },
  { id: 't-wca-2', name: 'Rig Mob/Demob', category: 'DRILLING', value: 50000, basis: 'PER_WELL', offsetDays: 0 },
  { id: 't-wca-3', name: 'Drilling - Tangibles', category: 'DRILLING', value: 135, basis: 'PER_FOOT', offsetDays: 10 },
  { id: 't-wca-4', name: 'Drilling - Intangibles', category: 'DRILLING', value: 380, basis: 'PER_FOOT', offsetDays: 10 },
  { id: 't-wca-5', name: 'Cement & Services', category: 'DRILLING', value: 140000, basis: 'PER_WELL', offsetDays: 15 },
  { id: 't-wca-6', name: 'Frac / Stimulation', category: 'COMPLETION', value: 700, basis: 'PER_FOOT', offsetDays: 45 },
  { id: 't-wca-7', name: 'Water Transfer/Disp', category: 'COMPLETION', value: 225000, basis: 'PER_WELL', offsetDays: 50 },
  { id: 't-wca-8', name: 'Tank Battery/Facilities', category: 'FACILITIES', value: 480000, basis: 'PER_WELL', offsetDays: 80 },
  { id: 't-wca-9', name: 'Tubing & Lift Equip', category: 'EQUIPMENT', value: 120000, basis: 'PER_WELL', offsetDays: 90 },
];

const BONE_SPRING_CAPEX: CapexItem[] = [
  { id: 't-bs-1', name: 'Location/Roads', category: 'FACILITIES', value: 80000, basis: 'PER_WELL', offsetDays: -15 },
  { id: 't-bs-2', name: 'Rig Mob/Demob', category: 'DRILLING', value: 45000, basis: 'PER_WELL', offsetDays: 0 },
  { id: 't-bs-3', name: 'Drilling - Tangibles', category: 'DRILLING', value: 115, basis: 'PER_FOOT', offsetDays: 10 },
  { id: 't-bs-4', name: 'Drilling - Intangibles', category: 'DRILLING', value: 320, basis: 'PER_FOOT', offsetDays: 10 },
  { id: 't-bs-5', name: 'Cement & Services', category: 'DRILLING', value: 110000, basis: 'PER_WELL', offsetDays: 15 },
  { id: 't-bs-6', name: 'Frac / Stimulation', category: 'COMPLETION', value: 580, basis: 'PER_FOOT', offsetDays: 45 },
  { id: 't-bs-7', name: 'Water Transfer/Disp', category: 'COMPLETION', value: 180000, basis: 'PER_WELL', offsetDays: 50 },
  { id: 't-bs-8', name: 'Tank Battery/Facilities', category: 'FACILITIES', value: 400000, basis: 'PER_WELL', offsetDays: 80 },
  { id: 't-bs-9', name: 'Tubing & Lift Equip', category: 'EQUIPMENT', value: 100000, basis: 'PER_WELL', offsetDays: 90 },
];

const DELAWARE_AVG_CAPEX: CapexItem[] = [
  { id: 't-del-1', name: 'Location/Roads', category: 'FACILITIES', value: 90000, basis: 'PER_WELL', offsetDays: -15 },
  { id: 't-del-2', name: 'Rig Mob/Demob', category: 'DRILLING', value: 48000, basis: 'PER_WELL', offsetDays: 0 },
  { id: 't-del-3', name: 'Drilling - Tangibles', category: 'DRILLING', value: 125, basis: 'PER_FOOT', offsetDays: 10 },
  { id: 't-del-4', name: 'Drilling - Intangibles', category: 'DRILLING', value: 350, basis: 'PER_FOOT', offsetDays: 10 },
  { id: 't-del-5', name: 'Cement & Services', category: 'DRILLING', value: 125000, basis: 'PER_WELL', offsetDays: 15 },
  { id: 't-del-6', name: 'Frac / Stimulation', category: 'COMPLETION', value: 640, basis: 'PER_FOOT', offsetDays: 45 },
  { id: 't-del-7', name: 'Water Transfer/Disp', category: 'COMPLETION', value: 200000, basis: 'PER_WELL', offsetDays: 50 },
  { id: 't-del-8', name: 'Tank Battery/Facilities', category: 'FACILITIES', value: 440000, basis: 'PER_WELL', offsetDays: 80 },
  { id: 't-del-9', name: 'Tubing & Lift Equip', category: 'EQUIPMENT', value: 110000, basis: 'PER_WELL', offsetDays: 90 },
];

const CONSERVATIVE_CAPEX: CapexItem[] = [
  { id: 't-con-1', name: 'Location/Roads', category: 'FACILITIES', value: 100000, basis: 'PER_WELL', offsetDays: -15 },
  { id: 't-con-2', name: 'Rig Mob/Demob', category: 'DRILLING', value: 55000, basis: 'PER_WELL', offsetDays: 0 },
  { id: 't-con-3', name: 'Drilling - Tangibles', category: 'DRILLING', value: 145, basis: 'PER_FOOT', offsetDays: 10 },
  { id: 't-con-4', name: 'Drilling - Intangibles', category: 'DRILLING', value: 400, basis: 'PER_FOOT', offsetDays: 10 },
  { id: 't-con-5', name: 'Cement & Services', category: 'DRILLING', value: 150000, basis: 'PER_WELL', offsetDays: 15 },
  { id: 't-con-6', name: 'Frac / Stimulation', category: 'COMPLETION', value: 750, basis: 'PER_FOOT', offsetDays: 45 },
  { id: 't-con-7', name: 'Water Transfer/Disp', category: 'COMPLETION', value: 240000, basis: 'PER_WELL', offsetDays: 50 },
  { id: 't-con-8', name: 'Tank Battery/Facilities', category: 'FACILITIES', value: 520000, basis: 'PER_WELL', offsetDays: 80 },
  { id: 't-con-9', name: 'Tubing & Lift Equip', category: 'EQUIPMENT', value: 130000, basis: 'PER_WELL', offsetDays: 90 },
];

export const ASSUMPTION_TEMPLATES: AssumptionTemplate[] = [
  {
    id: 'wolfcamp-a-t1',
    name: 'Wolfcamp A Tier 1',
    description: 'High-IP Wolfcamp A with premium completions',
    typeCurve: {
      qi: 1200,
      b: 1.3,
      di: 70,
      terminalDecline: 8,
      gorMcfPerBbl: 2.5,
    },
    capexItems: WOLFCAMP_A_CAPEX,
  },
  {
    id: 'bone-spring',
    name: 'Bone Spring',
    description: 'Moderate-IP Bone Spring with standard completions',
    typeCurve: {
      qi: 750,
      b: 1.1,
      di: 60,
      terminalDecline: 8,
      gorMcfPerBbl: 3.0,
    },
    capexItems: BONE_SPRING_CAPEX,
  },
  {
    id: 'delaware-avg',
    name: 'Delaware Basin Avg',
    description: 'Average Delaware Basin well with blended economics',
    typeCurve: {
      qi: 900,
      b: 1.2,
      di: 65,
      terminalDecline: 8,
      gorMcfPerBbl: 2.0,
    },
    capexItems: DELAWARE_AVG_CAPEX,
  },
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Low-IP conservative case with elevated costs',
    typeCurve: {
      qi: 600,
      b: 1.0,
      di: 55,
      terminalDecline: 8,
      gorMcfPerBbl: 1.5,
    },
    capexItems: CONSERVATIVE_CAPEX,
  },
];
