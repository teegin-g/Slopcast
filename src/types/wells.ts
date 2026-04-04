import type { TypeCurveParams } from './economics';
import type { CapexAssumptions } from './economics';
import type { OpexAssumptions } from './economics';
import type { OwnershipAssumptions } from './economics';
import type { ReserveCategory } from './economics';
import type { TaxAssumptions } from './economics';
import type { DebtAssumptions } from './economics';
import type { DealMetrics } from './economics';
import type { MonthlyCashFlow } from './economics';

export interface Well {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lateralLength: number; // in feet
  status: 'PRODUCING' | 'DUC' | 'PERMIT';
  operator: string;
  formation: string;
}

export interface WellGroup {
  id: string;
  name: string;
  color: string;
  wellIds: Set<string>;
  typeCurve: TypeCurveParams;
  capex: CapexAssumptions;
  opex: OpexAssumptions;
  ownership: OwnershipAssumptions;
  reserveCategory?: ReserveCategory;
  taxAssumptions?: TaxAssumptions;
  debtAssumptions?: DebtAssumptions;
  // Computed for display
  metrics?: DealMetrics;
  flow?: MonthlyCashFlow[];
}
