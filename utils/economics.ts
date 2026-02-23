
import { Well, TypeCurveParams, CapexAssumptions, CommodityPricingAssumptions, MonthlyCashFlow, DealMetrics, WellGroup, Scenario, SensitivityVariable, SensitivityMatrixResult, ScheduleParams, OpexAssumptions, OwnershipAssumptions, JvAgreement, TaxAssumptions, DebtAssumptions, ReserveCategory, DEFAULT_RESERVE_RISK_FACTORS } from '../types';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const getOpexSegmentForAgeMonth = (opex: OpexAssumptions, ageMonth: number) => {
  const segments = [...(opex.segments || [])].sort((a, b) => a.startMonth - b.startMonth);
  return segments.find(seg => ageMonth >= seg.startMonth && ageMonth <= seg.endMonth) || null;
};

type OwnershipFactors = {
  netRevenueFactor: number[];
  netCostFactor: number[];
};

const computeAgreementPayoutMonth = (
  agreement: JvAgreement,
  ownership: OwnershipAssumptions,
  grossRevenue: number[],
  grossOpex: number[],
  grossCapex: number[]
) => {
  const months = grossRevenue.length;
  const startIdx = Math.max(0, Math.floor((agreement.startMonth || 1) - 1));
  const baseNri = clamp01(ownership.baseNri);
  const baseCost = clamp01(ownership.baseCostInterest);

  const conveyRev = clamp01(agreement.prePayout.conveyRevenuePctOfBase);
  const conveyCost = clamp01(agreement.prePayout.conveyCostPctOfBase);

  const partnerRevFactor = baseNri * conveyRev;
  const partnerCostFactor = baseCost * conveyCost;

  let cumulative = 0;
  for (let i = startIdx; i < months; i++) {
    const partnerNet =
      (grossRevenue[i] * partnerRevFactor) -
      ((grossOpex[i] + grossCapex[i]) * partnerCostFactor);
    cumulative += partnerNet;
    if (cumulative >= 0) return i + 1; // calendar month (1-based)
  }
  return null;
};

const computeOwnershipFactors = (
  ownership: OwnershipAssumptions,
  grossRevenue: number[],
  grossOpex: number[],
  grossCapex: number[]
): OwnershipFactors => {
  const months = grossRevenue.length;
  const baseNri = clamp01(ownership.baseNri);
  const baseCost = clamp01(ownership.baseCostInterest);

  const payoutMonthsByAgreementId = new Map<string, number | null>();
  (ownership.agreements || []).forEach(agreement => {
    payoutMonthsByAgreementId.set(
      agreement.id,
      computeAgreementPayoutMonth(agreement, ownership, grossRevenue, grossOpex, grossCapex)
    );
  });

  const netRevenueFactor: number[] = new Array(months).fill(0);
  const netCostFactor: number[] = new Array(months).fill(0);

  for (let i = 0; i < months; i++) {
    let conveyedRevPct = 0;
    let conveyedCostPct = 0;

    for (const agreement of ownership.agreements || []) {
      const startIdx = Math.max(0, Math.floor((agreement.startMonth || 1) - 1));
      if (i < startIdx) continue;

      const payoutMonth = payoutMonthsByAgreementId.get(agreement.id) ?? null;
      const postStartsIdx = payoutMonth == null ? null : payoutMonth; // start post in month AFTER payoutMonth (1-based) => idx = payoutMonth
      const usePost = postStartsIdx != null && i >= postStartsIdx;
      const terms = usePost ? agreement.postPayout : agreement.prePayout;

      conveyedRevPct += clamp01(terms.conveyRevenuePctOfBase);
      conveyedCostPct += clamp01(terms.conveyCostPctOfBase);
    }

    conveyedRevPct = clamp01(conveyedRevPct);
    conveyedCostPct = clamp01(conveyedCostPct);

    netRevenueFactor[i] = baseNri * (1 - conveyedRevPct);
    netCostFactor[i] = baseCost * (1 - conveyedCostPct);
  }

  return { netRevenueFactor, netCostFactor };
};

export const calculateEconomics = (
  selectedWells: Well[],
  tc: TypeCurveParams,
  capex: CapexAssumptions,
  pricing: CommodityPricingAssumptions,
  opex: OpexAssumptions,
  ownership: OwnershipAssumptions,
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

  // --- 3. Generate Gross Cash Flows (then apply Ownership/JV netting) ---
  const oilProduction: number[] = new Array(monthsToProject).fill(0);
  const gasProduction: number[] = new Array(monthsToProject).fill(0);
  const grossRevenue: number[] = new Array(monthsToProject).fill(0);
  const grossOpex: number[] = new Array(monthsToProject).fill(0);
  const grossCapex: number[] = new Array(monthsToProject).fill(0);

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

      const prodStartMonthIdx = Math.floor(startMonthOffset) + 1;
      const capexMonthIdx = Math.floor(startMonthOffset); 

      if (capexMonthIdx >= 0 && capexMonthIdx < monthsToProject) {
          grossCapex[capexMonthIdx] += wellTotalCapex;
      }

      for (let t = 1; t <= monthsToProject; t++) {
          const calendarMonthIdx = prodStartMonthIdx + t - 1;
          
          if (calendarMonthIdx >= 0 && calendarMonthIdx < monthsToProject) {
              let q_t = 0;
              if (b === 0) {
                  q_t = qi_monthly * Math.exp(-Di_monthly * t);
              } else {
                  q_t = qi_monthly / Math.pow(1 + b * Di_monthly * t, 1/b);
              }

              const gas_t = q_t * (tc.gorMcfPerBbl || 0);

              const revenueGross = (q_t * realizedOil) + (gas_t * realizedGas);
              const seg = getOpexSegmentForAgeMonth(opex, t);
              const fixed = seg ? seg.fixedPerWellPerMonth : 0;
              const varOil = seg ? seg.variableOilPerBbl : 0;
              const varGas = seg ? seg.variableGasPerMcf : 0;
              const opexGross = fixed + (q_t * varOil) + (gas_t * varGas);

              oilProduction[calendarMonthIdx] += q_t;
              gasProduction[calendarMonthIdx] += gas_t;
              grossRevenue[calendarMonthIdx] += revenueGross;
              grossOpex[calendarMonthIdx] += opexGross;
              
              totalOil += q_t;
          }
      }
  });

  const { netRevenueFactor, netCostFactor } = computeOwnershipFactors(ownership, grossRevenue, grossOpex, grossCapex);

  // --- 4. Final Metrics (Net of Ownership/JVs) ---
  let cumulativeCash = 0;
  let npv = 0;
  let payoutMonth = 0;
  let payoutFound = false;
  let totalNetCapex = 0;

  const finalFlow: MonthlyCashFlow[] = [];
  for (let i = 0; i < monthsToProject; i++) {
    const revenue = grossRevenue[i] * netRevenueFactor[i];
    const opexNet = grossOpex[i] * netCostFactor[i];
    const capexNet = grossCapex[i] * netCostFactor[i];
    const netCashFlow = revenue - opexNet - capexNet;

    totalNetCapex += capexNet;
    cumulativeCash += netCashFlow;
    npv += netCashFlow / Math.pow(1 + monthlyDiscountRate, i + 1);

    if (!payoutFound && cumulativeCash >= 0) {
      payoutMonth = i + 1;
      payoutFound = true;
    }

    finalFlow.push({
      month: i + 1,
      date: `Month ${i + 1}`,
      oilProduction: oilProduction[i],
      gasProduction: gasProduction[i],
      revenue,
      capex: capexNet,
      opex: opexNet,
      netCashFlow,
      cumulativeCashFlow: cumulativeCash,
    });
  }

  return {
    flow: finalFlow,
    metrics: {
      totalCapex: totalNetCapex,
      eur: totalOil,
      npv10: npv,
      irr: 0,
      payoutMonths: payoutMonth,
      wellCount: selectedWells.length
    }
  };
};

// --- TAX LAYER ---
export const applyTaxLayer = (
  flow: MonthlyCashFlow[],
  metrics: DealMetrics,
  tax: TaxAssumptions
): { flow: MonthlyCashFlow[], metrics: DealMetrics } => {
  const monthlyDiscountRate = 0.10 / 12;
  let cumulativeAfterTax = 0;
  let afterTaxNpv = 0;
  let afterTaxPayoutMonth = 0;
  let afterTaxPayoutFound = false;

  const taxedFlow = flow.map((f, i) => {
    // Severance tax on gross revenue
    const severanceTax = f.revenue * (tax.severanceTaxPct / 100);
    // Ad valorem tax on capex (assessed value proxy)
    const adValoremTax = f.capex * (tax.adValoremTaxPct / 100);
    // Pre-tax income
    const preTaxIncome = f.netCashFlow - severanceTax - adValoremTax;
    // Depletion allowance (% of gross revenue, capped at 65% of pre-tax income)
    const depletionRaw = f.revenue * (tax.depletionAllowancePct / 100);
    const depletionAllowance = Math.min(depletionRaw, Math.max(0, preTaxIncome * 0.65));
    // Taxable income
    const taxableIncome = Math.max(0, preTaxIncome - depletionAllowance);
    // Income tax
    const incomeTax = taxableIncome * ((tax.federalTaxRate + tax.stateTaxRate) / 100);
    // After-tax cash flow
    const afterTaxCashFlow = preTaxIncome - incomeTax;

    cumulativeAfterTax += afterTaxCashFlow;
    afterTaxNpv += afterTaxCashFlow / Math.pow(1 + monthlyDiscountRate, i + 1);

    if (!afterTaxPayoutFound && cumulativeAfterTax >= 0) {
      afterTaxPayoutMonth = i + 1;
      afterTaxPayoutFound = true;
    }

    return {
      ...f,
      severanceTax,
      adValoremTax,
      incomeTax,
      afterTaxCashFlow,
      cumulativeAfterTaxCashFlow: cumulativeAfterTax,
    };
  });

  return {
    flow: taxedFlow,
    metrics: {
      ...metrics,
      afterTaxNpv10: afterTaxNpv,
      afterTaxPayoutMonths: afterTaxPayoutMonth,
    },
  };
};

// --- DEBT / LEVERAGE LAYER ---
export const applyDebtLayer = (
  flow: MonthlyCashFlow[],
  metrics: DealMetrics,
  debt: DebtAssumptions
): { flow: MonthlyCashFlow[], metrics: DealMetrics } => {
  if (!debt.enabled) return { flow, metrics };

  const monthlyDiscountRate = 0.10 / 12;
  const revolverMonthlyRate = (debt.revolverRate / 100) / 12;
  const termMonthlyRate = (debt.termLoanRate / 100) / 12;
  const termMonthlyPayment = debt.termLoanAmount > 0 && debt.termLoanAmortMonths > 0
    ? (debt.termLoanAmount * termMonthlyRate) / (1 - Math.pow(1 + termMonthlyRate, -debt.termLoanAmortMonths))
    : 0;

  let revolverBalance = 0;
  let termBalance = debt.termLoanAmount;
  let cumulativeLevered = 0;
  let leveredNpv = 0;
  let totalDebtService = 0;
  let totalCashAvailable = 0;

  const leveredFlow = flow.map((f, i) => {
    // Base cash flow (use afterTax if available, otherwise netCashFlow)
    const baseCf = f.afterTaxCashFlow ?? f.netCashFlow;

    // Interest on outstanding balances
    const revolverInterest = revolverBalance * revolverMonthlyRate;
    const termInterest = termBalance * termMonthlyRate;
    const totalInterest = revolverInterest + termInterest;

    // Term loan principal
    const termPrincipal = termBalance > 0 ? Math.min(termBalance, Math.max(0, termMonthlyPayment - termInterest)) : 0;

    // Available cash after debt service
    const cashAfterService = baseCf - totalInterest - termPrincipal;

    // Cash sweep on excess cash
    let revolverPaydown = 0;
    if (cashAfterService > 0 && revolverBalance > 0) {
      revolverPaydown = Math.min(revolverBalance, cashAfterService * (debt.cashSweepPct / 100));
    }

    // If negative cash, draw from revolver
    let revolverDraw = 0;
    if (cashAfterService < 0) {
      const deficit = Math.abs(cashAfterService);
      revolverDraw = Math.min(deficit, debt.revolverSize - revolverBalance);
    }

    // Update balances
    revolverBalance = revolverBalance - revolverPaydown + revolverDraw;
    termBalance = Math.max(0, termBalance - termPrincipal);

    const totalPrincipal = termPrincipal + revolverPaydown;
    const leveredCashFlow = baseCf - totalInterest - totalPrincipal + revolverDraw;

    cumulativeLevered += leveredCashFlow;
    leveredNpv += leveredCashFlow / Math.pow(1 + monthlyDiscountRate, i + 1);

    // DSCR tracking
    if (baseCf > 0) totalCashAvailable += baseCf;
    totalDebtService += totalInterest + totalPrincipal;

    return {
      ...f,
      interestExpense: totalInterest,
      principalPayment: totalPrincipal,
      leveredCashFlow,
      cumulativeLeveredCashFlow: cumulativeLevered,
      outstandingDebt: revolverBalance + termBalance,
    };
  });

  const dscr = totalDebtService > 0 ? totalCashAvailable / totalDebtService : 0;

  return {
    flow: leveredFlow,
    metrics: {
      ...metrics,
      leveredNpv10: leveredNpv,
      dscr,
      equityIrr: 0, // simplified - full IRR computation is complex
    },
  };
};

// --- RESERVES RISK LAYER ---
export const applyReservesRisk = (
  metrics: DealMetrics,
  reserveCategory?: ReserveCategory
): DealMetrics => {
  if (!reserveCategory) return metrics;
  const riskFactor = DEFAULT_RESERVE_RISK_FACTORS[reserveCategory] ?? 1.0;
  return {
    ...metrics,
    riskedEur: metrics.eur * riskFactor,
    riskedNpv10: metrics.npv10 * riskFactor,
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
            gasProduction: 0,
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
                aggregatedFlow[i].gasProduction += f.gasProduction;
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
    basePricing: CommodityPricingAssumptions,
    xVar: SensitivityVariable,
    xSteps: number[],
    yVar: SensitivityVariable,
    ySteps: number[]
): SensitivityMatrixResult[][] => {

    // Helper to get parameters for a step
    const getParamsForStep = (
        variable: SensitivityVariable, 
        value: number, 
        currentScalars: { capex: number, production: number },
        currentPricing: CommodityPricingAssumptions,
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
                let pricing = { ...basePricing };
                
                // Construct default schedule from group legacy or simple default
                let schedule: ScheduleParams = {
                    annualRigs: new Array(10).fill(group.capex.rigCount || 1),
                    drillDurationDays: group.capex.drillDurationDays,
                    stimDurationDays: group.capex.stimDurationDays,
                    rigStartDate: group.capex.rigStartDate
                };

                // Apply Y modification
                const r1 = getParamsForStep(yVar, yVal, scalars, pricing, schedule);
                scalars = r1.newScalars;
                pricing = r1.newPricing;
                schedule = r1.newSchedule;

                // Apply X modification
                const r2 = getParamsForStep(xVar, xVal, scalars, pricing, schedule);
                scalars = r2.newScalars;
                pricing = r2.newPricing;
                schedule = r2.newSchedule;

                const { metrics } = calculateEconomics(groupWells, group.typeCurve, group.capex, pricing, group.opex, group.ownership, scalars, schedule);
                portfolioNpv += metrics.npv10;
            }

            row.push({ xValue: xVal, yValue: yVal, npv: portfolioNpv });
        }
        matrix.push(row);
    }

    return matrix;
};
