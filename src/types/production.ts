export interface MonthlyProduction {
  /** 0-based months from this series' first production month. */
  monthIndex: number;
  oilBbl: number;
  gasMcf: number;
}

export interface WellProductionSeries {
  wellId: string;
  /** Months from the group's t0 (shared timeline origin) to this well's first production. */
  firstProductionMonthOffset: number;
  months: MonthlyProduction[];
}
