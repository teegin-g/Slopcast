
import { Well, TypeCurveParams, CapexAssumptions, PricingAssumptions, MonthlyCashFlow, DealMetrics, WellGroup, Scenario, SensitivityVariable, SensitivityMatrixResult, ScheduleParams } from '../types';

export const calculateEconomics = (
  selectedWells: Well[],
  tc: TypeCurveParams,
  capex: CapexAssumptions,
  pricing: PricingAssumptions,
  scalars: { capex: number; production: number } = { capex: 1, production: 1 },
  scheduleOverride?: ScheduleParams 
): { flow: MonthlyCashFlow[], metrics: DealMetrics } => {

  const monthsToProject = 120; // 10 years
  
  if (selectedWells.length === 0) {
      return {
          flow: [],
          metrics: { totalCapex: 0, eur: 0, npv10: 0, irr: 0, payoutMonths: 0, wellCount: 0 }
      };
  }

  // --- 1. Rank Wells ---
  const sortedWells = [...selectedWells].sort((a, b) => b.lateralLength - a.lateralLength);

  // --- 2. Schedule Wells ---
  // Determine Drill/Stim days
  const drillDays = scheduleOverride ? scheduleOverride.drillDurationDays : capex.drillDurationDays;
  const stimDays = scheduleOverride ? scheduleOverride.stimDurationDays : capex.stimDurationDays;
  const cycleTimeMonths = (drillDays + stimDays) / 30.4;

  // Initialize Rig Availability
  // If override exists, use annual schedule. Else use flat rig count from Capex.
  let rigAvailability: number[] = [];

  if (scheduleOverride) {
      const annualRigs = scheduleOverride.annualRigs;
      const startCount = Math.max(1, annualRigs[0] || 1);
      
      // Initialize Year 1 rigs
      for(let i=0; i<startCount; i++) rigAvailability.push(0);

      // Handle Ramps (Adding rigs in future years)
      // Note: This logic assumes we add rigs, not remove them (simple ramp up)
      for(let y=1; y<annualRigs.length; y++) {
          const prev = annualRigs[y-1] || 0;
          const curr = annualRigs[y] || 0;
          if (curr > prev) {
              const diff = curr - prev;
              const startTime = y * 12; // Start of Year Y (Month 12, 24, etc)
              for(let k=0; k<diff; k++) {
                  rigAvailability.push(startTime);
              }
          }
      }
  } else {
      const count = Math.max(1, Math.round(capex.rigCount));
      rigAvailability = new Array(count).fill(0);
  }

  // Assign Wells to best slot
  const wellSchedules = sortedWells.map(well => {
      let bestRigIdx = 0;
      // Find rig with earliest availability
      for (let i = 1; i < rigAvailability.length; i++) {
          if (rigAvailability[i] < rigAvailability[bestRigIdx]) {
              bestRigIdx = i;
          }
      }
      const startMonth = rigAvailability[bestRigIdx];
      rigAvailability[bestRigIdx] += cycleTimeMonths;
      return { well, startMonthOffset: startMonth };
  });

  // --- 3. Generate Cash Flows ---
  const aggregatedFlow: MonthlyCashFlow[] = [];
  for(let t = 1; t <= monthsToProject + 24; t++) { 
    aggregatedFlow.push({
        month: t,
        date: `Month ${t}`,
        oilProduction: 0,
        revenue: 0,
        capex: 0,
        opex: 0,
        netCashFlow: 0,
        cumulativeCashFlow: 0
    });
  }

  let totalCapex = 0;
  let totalOil = 0;
  
  const Di_monthly = 1 - Math.pow(1 - (tc.di / 100), 1/12);
  const b = tc.b;
  const qi_monthly = tc.qi * 30.4 * scalars.production; 
  const monthlyDiscountRate = 0.10 / 12;
  
  // Realized Prices (Net of Differentials)
  const realizedOil = pricing.oilPrice - (pricing.oilDifferential || 0);
  const realizedGas = pricing.gasPrice - (pricing.gasDifferential || 0);

  wellSchedules.forEach(({ well, startMonthOffset }) => {
      
      const rawWellCapex = capex.items.reduce((sum, item) => {
        return sum + (item.basis === 'PER_FOOT' ? item.value * well.lateralLength : item.value);
      }, 0);
      
      const wellTotalCapex = rawWellCapex * scalars.capex; 

      totalCapex += wellTotalCapex;

      const prodStartMonthIdx = Math.floor(startMonthOffset) + 1;
      const capexMonthIdx = Math.floor(startMonthOffset); 

      if (aggregatedFlow[capexMonthIdx]) {
          aggregatedFlow[capexMonthIdx].capex += wellTotalCapex;
      }

      for (let t = 1; t <= monthsToProject; t++) {
          const calendarMonthIdx = prodStartMonthIdx + t - 1;
          
          if (calendarMonthIdx < aggregatedFlow.length) {
              let q_t = 0;
              if (b === 0) {
                  q_t = qi_monthly * Math.exp(-Di_monthly * t);
              } else {
                  q_t = qi_monthly / Math.pow(1 + b * Di_monthly * t, 1/b);
              }

              // Simple Revenue: (Oil * RealizedPrice) * NRI
              // Note: Assuming gas is 0 for this simple calculation or included in BOE/Price approximation
              // If we want gas revenue, we need Gas type curve. 
              // For now, prompt implies Oil focus, so we use q_t as BOE or Oil.
              
              const revenue = q_t * realizedOil * pricing.nri;
              const opex = pricing.loePerMonth; 

              aggregatedFlow[calendarMonthIdx].oilProduction += q_t;
              aggregatedFlow[calendarMonthIdx].revenue += revenue;
              aggregatedFlow[calendarMonthIdx].opex += opex;
              
              totalOil += q_t;
          }
      }
  });

  // --- 4. Final Metrics ---
  let cumulativeCash = 0;
  let npv = 0; 
  let payoutMonth = 0;
  let payoutFound = false;

  const finalFlow = aggregatedFlow.slice(0, monthsToProject); 

  finalFlow.forEach(f => {
      f.netCashFlow = f.revenue - f.opex - f.capex;
      cumulativeCash += f.netCashFlow;
      f.cumulativeCashFlow = cumulativeCash;

      npv += f.netCashFlow / Math.pow(1 + monthlyDiscountRate, f.month);

      if (!payoutFound && cumulativeCash >= 0) {
          payoutMonth = f.month;
          payoutFound = true;
      }
  });

  return {
    flow: finalFlow,
    metrics: {
      totalCapex,
      eur: totalOil,
      npv10: npv,
      irr: 0,
      payoutMonths: payoutMonth,
      wellCount: selectedWells.length
    }
  };
};

// --- AGGREGATION ---
export const aggregateEconomics = (groups: WellGroup[]): { flow: MonthlyCashFlow[], metrics: DealMetrics } => {
    // Basic aggregation remains the same
    const monthsToProject = 120;
    const aggregatedFlow: MonthlyCashFlow[] = [];
    
    for(let t = 1; t <= monthsToProject; t++) {
        aggregatedFlow.push({
            month: t,
            date: `Month ${t}`,
            oilProduction: 0,
            revenue: 0,
            capex: 0,
            opex: 0,
            netCashFlow: 0,
            cumulativeCashFlow: 0
        });
    }

    let totalCapex = 0;
    let totalEur = 0;
    let totalNpv10 = 0;
    let totalWellCount = 0;
    
    groups.forEach(group => {
        if (!group.flow || !group.metrics) return;

        totalCapex += group.metrics.totalCapex;
        totalEur += group.metrics.eur;
        totalNpv10 += group.metrics.npv10;
        totalWellCount += group.metrics.wellCount;

        group.flow.forEach((f, i) => {
            if (aggregatedFlow[i]) {
                aggregatedFlow[i].oilProduction += f.oilProduction;
                aggregatedFlow[i].revenue += f.revenue;
                aggregatedFlow[i].capex += f.capex;
                aggregatedFlow[i].opex += f.opex;
                aggregatedFlow[i].netCashFlow += f.netCashFlow;
            }
        });
    });

    let cumulative = 0;
    let payoutMonth = 0;
    let payoutFound = false;

    aggregatedFlow.forEach(f => {
        cumulative += f.netCashFlow;
        f.cumulativeCashFlow = cumulative;
        if (!payoutFound && cumulative >= 0) {
            payoutMonth = f.month;
            payoutFound = true;
        }
    });

    return {
        flow: aggregatedFlow,
        metrics: {
            totalCapex,
            eur: totalEur,
            npv10: totalNpv10,
            irr: 0, 
            payoutMonths: payoutMonth,
            wellCount: totalWellCount
        }
    };
};

// --- SENSITIVITY MATRIX LOGIC ---

export const generateSensitivityMatrix = (
    baseGroups: WellGroup[],
    wells: Well[],
    xVar: SensitivityVariable,
    xSteps: number[],
    yVar: SensitivityVariable,
    ySteps: number[]
): SensitivityMatrixResult[][] => {

    // Helper to get parameters for a step
    const getParamsForStep = (
        group: WellGroup, 
        variable: SensitivityVariable, 
        value: number, 
        currentScalars: { capex: number, production: number },
        currentPricing: PricingAssumptions,
        currentSchedule: ScheduleParams
    ) => {
        const newScalars = { ...currentScalars };
        const newPricing = { ...currentPricing };
        const newSchedule = { ...currentSchedule };

        if (variable === 'OIL_PRICE') newPricing.oilPrice = value;
        if (variable === 'CAPEX_SCALAR') newScalars.capex = value; 
        if (variable === 'EUR_SCALAR') newScalars.production = value;
        if (variable === 'RIG_COUNT') {
             // For Matrix, we apply flat rig count override to the whole schedule array
             newSchedule.annualRigs = new Array(10).fill(value);
        }

        return { newScalars, newPricing, newSchedule };
    };

    const matrix: SensitivityMatrixResult[][] = [];

    // Rows (Y)
    for (const yVal of ySteps) {
        const row: SensitivityMatrixResult[] = [];
        
        // Cols (X)
        for (const xVal of xSteps) {
            
            // Calculate Portfolio NPV for this coordinate (xVal, yVal)
            let portfolioNpv = 0;

            for (const group of baseGroups) {
                const groupWells = wells.filter(w => group.wellIds.has(w.id));
                
                // Start with base defaults
                let scalars = { capex: 1, production: 1 };
                let pricing = { ...group.pricing };
                
                // Construct default schedule from group legacy or simple default
                let schedule: ScheduleParams = {
                    annualRigs: new Array(10).fill(group.capex.rigCount || 1),
                    drillDurationDays: group.capex.drillDurationDays,
                    stimDurationDays: group.capex.stimDurationDays,
                    rigStartDate: group.capex.rigStartDate
                };

                // Apply Y modification
                const r1 = getParamsForStep(group, yVar, yVal, scalars, pricing, schedule);
                scalars = r1.newScalars;
                pricing = r1.newPricing;
                schedule = r1.newSchedule;

                // Apply X modification
                const r2 = getParamsForStep(group, xVar, xVal, scalars, pricing, schedule);
                scalars = r2.newScalars;
                pricing = r2.newPricing;
                schedule = r2.newSchedule;

                const { metrics } = calculateEconomics(groupWells, group.typeCurve, group.capex, pricing, scalars, schedule);
                portfolioNpv += metrics.npv10;
            }

            row.push({ xValue: xVal, yValue: yVal, npv: portfolioNpv });
        }
        matrix.push(row);
    }

    return matrix;
};
