from __future__ import annotations

import math

from .models import (
    CapexAssumptions,
    DebtAssumptions,
    DealMetrics,
    EconomicsResponse,
    MonthlyCashFlow,
    OpexAssumptions,
    OwnershipAssumptions,
    PricingAssumptions,
    ReserveCategory,
    Scalars,
    ScheduleParams,
    TaxAssumptions,
    TypeCurveParams,
    Well,
    WellGroup,
)


DEFAULT_RESERVE_RISK_FACTORS: dict[ReserveCategory, float] = {
    "PDP": 1.0,
    "PUD": 0.85,
    "PROBABLE": 0.50,
    "POSSIBLE": 0.15,
}


def _clamp01(value: float) -> float:
    return min(1.0, max(0.0, value))


def _legacy_opex(pricing: PricingAssumptions) -> OpexAssumptions:
    return OpexAssumptions(
        segments=[
            {
                "id": "legacy-loe",
                "label": "Legacy LOE",
                "startMonth": 1,
                "endMonth": 120,
                "fixedPerWellPerMonth": pricing.loePerMonth or 0.0,
                "variableOilPerBbl": 0.0,
                "variableGasPerMcf": 0.0,
            }
        ]
    )


def _legacy_ownership(pricing: PricingAssumptions) -> OwnershipAssumptions:
    nri = pricing.nri if pricing.nri is not None else 1.0
    return OwnershipAssumptions(baseNri=nri, baseCostInterest=1.0, agreements=[])


def _get_opex_segment_for_age_month(opex: OpexAssumptions, age_month: int):
    segments = sorted(opex.segments or [], key=lambda seg: seg.startMonth)
    for segment in segments:
        if segment.startMonth <= age_month <= segment.endMonth:
            return segment
    return None


def _compute_agreement_payout_month(
    agreement,
    ownership: OwnershipAssumptions,
    gross_revenue: list[float],
    gross_opex: list[float],
    gross_capex: list[float],
) -> int | None:
    months = len(gross_revenue)
    start_idx = max(0, math.floor((agreement.startMonth or 1) - 1))
    base_nri = _clamp01(ownership.baseNri)
    base_cost = _clamp01(ownership.baseCostInterest)
    convey_rev = _clamp01(agreement.prePayout.conveyRevenuePctOfBase)
    convey_cost = _clamp01(agreement.prePayout.conveyCostPctOfBase)
    partner_rev_factor = base_nri * convey_rev
    partner_cost_factor = base_cost * convey_cost

    cumulative = 0.0
    for i in range(start_idx, months):
        partner_net = (gross_revenue[i] * partner_rev_factor) - (
            (gross_opex[i] + gross_capex[i]) * partner_cost_factor
        )
        cumulative += partner_net
        if cumulative >= 0:
            return i + 1
    return None


def _compute_ownership_factors(
    ownership: OwnershipAssumptions,
    gross_revenue: list[float],
    gross_opex: list[float],
    gross_capex: list[float],
) -> tuple[list[float], list[float]]:
    months = len(gross_revenue)
    base_nri = _clamp01(ownership.baseNri)
    base_cost = _clamp01(ownership.baseCostInterest)

    payout_months = {
        agreement.id: _compute_agreement_payout_month(
            agreement, ownership, gross_revenue, gross_opex, gross_capex
        )
        for agreement in ownership.agreements or []
    }

    net_revenue_factor = [0.0 for _ in range(months)]
    net_cost_factor = [0.0 for _ in range(months)]

    for i in range(months):
        conveyed_rev_pct = 0.0
        conveyed_cost_pct = 0.0

        for agreement in ownership.agreements or []:
            start_idx = max(0, math.floor((agreement.startMonth or 1) - 1))
            if i < start_idx:
                continue
            payout_month = payout_months.get(agreement.id)
            use_post = payout_month is not None and i >= payout_month
            terms = agreement.postPayout if use_post else agreement.prePayout
            conveyed_rev_pct += _clamp01(terms.conveyRevenuePctOfBase)
            conveyed_cost_pct += _clamp01(terms.conveyCostPctOfBase)

        net_revenue_factor[i] = base_nri * (1 - _clamp01(conveyed_rev_pct))
        net_cost_factor[i] = base_cost * (1 - _clamp01(conveyed_cost_pct))

    return net_revenue_factor, net_cost_factor


def _should_cutoff(seg, rate_monthly: float, local_months: int, cum_production: float) -> bool:
    kind = (seg.cutoffKind if hasattr(seg, "cutoffKind") else seg["cutoffKind"]) or "default"
    raw_value = seg.cutoffValue if hasattr(seg, "cutoffValue") else seg["cutoffValue"]
    value = raw_value or 0.0
    if kind == "default":
        return False
    if kind == "rate":
        return rate_monthly <= value * 30.4
    if kind == "time_days":
        return local_months * 30.4 >= value
    if kind == "cum":
        return cum_production >= value
    return False


def _evaluate_multi_segment_production(
    tc: TypeCurveParams,
    months_to_project: int,
    production_scalar: float,
) -> tuple[list[float], list[float]]:
    segments = tc.segments or [
        {
            "id": "default",
            "name": "Default",
            "method": "arps",
            "qi": tc.qi,
            "b": tc.b,
            "initialDecline": tc.di,
            "cutoffKind": "default",
            "cutoffValue": None,
        }
    ]
    oil_by_month = [0.0 for _ in range(months_to_project)]
    gas_by_month = [0.0 for _ in range(months_to_project)]

    current_month = 0
    first_qi = getattr(segments[0], "qi", None) if not isinstance(segments[0], dict) else segments[0]["qi"]
    current_rate = (first_qi if first_qi is not None else tc.qi) * 30.4 * production_scalar

    for segment in segments:
        if current_month >= months_to_project:
            break
        qi_raw = segment.qi if hasattr(segment, "qi") else segment["qi"]
        b_raw = segment.b if hasattr(segment, "b") else segment["b"]
        di_raw = segment.initialDecline if hasattr(segment, "initialDecline") else segment["initialDecline"]
        qi = qi_raw * 30.4 * production_scalar if qi_raw is not None else current_rate
        b = b_raw if b_raw is not None else 0.0
        di_annual = di_raw if di_raw is not None else 8.0
        di_monthly = 1 - math.pow(1 - (di_annual / 100.0), 1 / 12.0)

        local_t = 0
        cum_prod = 0.0
        while current_month < months_to_project:
            local_t += 1
            if b == 0:
                q_t = qi * math.exp(-di_monthly * local_t)
            else:
                q_t = qi / math.pow(1 + b * di_monthly * local_t, 1 / b)

            if _should_cutoff(segment, q_t, local_t, cum_prod):
                current_rate = q_t
                break

            oil_by_month[current_month] = q_t
            gas_by_month[current_month] = q_t * (tc.gorMcfPerBbl or 0.0)
            cum_prod += q_t
            current_rate = q_t
            current_month += 1

    return oil_by_month, gas_by_month


def calculate_economics(
    selected_wells: list[Well],
    tc: TypeCurveParams,
    capex: CapexAssumptions,
    pricing: PricingAssumptions,
    opex: OpexAssumptions | None = None,
    ownership: OwnershipAssumptions | None = None,
    scalars: Scalars | None = None,
    schedule_override: ScheduleParams | None = None,
    tax_assumptions: TaxAssumptions | None = None,
    debt_assumptions: DebtAssumptions | None = None,
    reserve_category: ReserveCategory | None = None,
) -> EconomicsResponse:
    months_to_project = 120
    scalars = scalars or Scalars()
    opex = opex or _legacy_opex(pricing)
    ownership = ownership or _legacy_ownership(pricing)

    if len(selected_wells) == 0:
        return EconomicsResponse(
            flow=[],
            metrics=DealMetrics(
                totalCapex=0.0,
                eur=0.0,
                npv10=0.0,
                irr=0.0,
                payoutMonths=0,
                wellCount=0,
            ),
        )

    sorted_wells = sorted(selected_wells, key=lambda w: w.lateralLength, reverse=True)
    drill_days = schedule_override.drillDurationDays if schedule_override else capex.drillDurationDays
    stim_days = schedule_override.stimDurationDays if schedule_override else capex.stimDurationDays
    cycle_time_months = (drill_days + stim_days) / 30.4

    if schedule_override:
        annual_rigs = schedule_override.annualRigs
        start_count = max(1, int(math.ceil(annual_rigs[0] if annual_rigs else 1)))
        rig_availability = [0.0 for _ in range(start_count)]
        for y in range(1, len(annual_rigs)):
            prev = annual_rigs[y - 1] or 0
            curr = annual_rigs[y] or 0
            if curr > prev:
                for _ in range(int(math.ceil(curr - prev))):
                    rig_availability.append(float(y * 12))
    else:
        rig_availability = [0.0 for _ in range(max(1, round(capex.rigCount)))]

    well_schedules: list[tuple[Well, float]] = []
    for well in sorted_wells:
        best_rig_idx = 0
        for i in range(1, len(rig_availability)):
            if rig_availability[i] < rig_availability[best_rig_idx]:
                best_rig_idx = i
        start_month = rig_availability[best_rig_idx]
        rig_availability[best_rig_idx] += cycle_time_months
        well_schedules.append((well, start_month))

    oil_production = [0.0 for _ in range(months_to_project)]
    gas_production = [0.0 for _ in range(months_to_project)]
    gross_revenue = [0.0 for _ in range(months_to_project)]
    gross_opex = [0.0 for _ in range(months_to_project)]
    gross_capex = [0.0 for _ in range(months_to_project)]
    total_oil = 0.0
    monthly_discount_rate = 0.10 / 12.0
    realized_oil = pricing.oilPrice - (pricing.oilDifferential or 0.0)
    realized_gas = pricing.gasPrice - (pricing.gasDifferential or 0.0)

    for well, start_month_offset in well_schedules:
        raw_well_capex = sum(
            item.value * well.lateralLength if item.basis == "PER_FOOT" else item.value
            for item in capex.items
        )
        well_total_capex = raw_well_capex * scalars.capex
        prod_start_month_idx = math.floor(start_month_offset) + 1
        capex_month_idx = math.floor(start_month_offset)

        if 0 <= capex_month_idx < months_to_project:
            gross_capex[capex_month_idx] += well_total_capex

        oil_by_month, gas_by_month = _evaluate_multi_segment_production(
            tc, months_to_project, scalars.production
        )

        for t in range(months_to_project):
            calendar_month_idx = prod_start_month_idx + t
            if 0 <= calendar_month_idx < months_to_project:
                q_t = oil_by_month[t]
                gas_t = gas_by_month[t]
                opex_seg = _get_opex_segment_for_age_month(opex, t + 1)
                fixed = opex_seg.fixedPerWellPerMonth if opex_seg else 0.0
                var_oil = opex_seg.variableOilPerBbl if opex_seg else 0.0
                var_gas = opex_seg.variableGasPerMcf if opex_seg else 0.0
                revenue_gross = (q_t * realized_oil) + (gas_t * realized_gas)
                opex_gross = fixed + (q_t * var_oil) + (gas_t * var_gas)

                oil_production[calendar_month_idx] += q_t
                gas_production[calendar_month_idx] += gas_t
                gross_revenue[calendar_month_idx] += revenue_gross
                gross_opex[calendar_month_idx] += opex_gross
                total_oil += q_t

    net_revenue_factor, net_cost_factor = _compute_ownership_factors(
        ownership, gross_revenue, gross_opex, gross_capex
    )

    cumulative_cash = 0.0
    npv = 0.0
    payout_month = 0
    payout_found = False
    total_net_capex = 0.0
    final_flow: list[MonthlyCashFlow] = []

    for i in range(months_to_project):
        revenue = gross_revenue[i] * net_revenue_factor[i]
        opex_net = gross_opex[i] * net_cost_factor[i]
        capex_net = gross_capex[i] * net_cost_factor[i]
        net_cash_flow = revenue - opex_net - capex_net
        total_net_capex += capex_net
        cumulative_cash += net_cash_flow
        npv += net_cash_flow / math.pow(1 + monthly_discount_rate, i + 1)
        if (not payout_found) and cumulative_cash >= 0:
            payout_month = i + 1
            payout_found = True

        final_flow.append(
            MonthlyCashFlow(
                month=i + 1,
                date=f"Month {i + 1}",
                oilProduction=oil_production[i],
                gasProduction=gas_production[i],
                revenue=revenue,
                capex=capex_net,
                opex=opex_net,
                netCashFlow=net_cash_flow,
                cumulativeCashFlow=cumulative_cash,
            )
        )

    metrics = DealMetrics(
        totalCapex=total_net_capex,
        eur=total_oil,
        npv10=npv,
        irr=0.0,
        payoutMonths=payout_month,
        wellCount=len(selected_wells),
    )
    response = EconomicsResponse(flow=final_flow, metrics=metrics)

    if tax_assumptions is not None:
        response = apply_tax_layer(response.flow, response.metrics, tax_assumptions)
    if debt_assumptions is not None and debt_assumptions.enabled:
        response = apply_debt_layer(response.flow, response.metrics, debt_assumptions)
    if reserve_category is not None:
        response.metrics = apply_reserves_risk(response.metrics, reserve_category)

    return response


def apply_tax_layer(
    flow: list[MonthlyCashFlow],
    metrics: DealMetrics,
    tax: TaxAssumptions,
) -> EconomicsResponse:
    monthly_discount_rate = 0.10 / 12.0
    cumulative_after_tax = 0.0
    after_tax_npv = 0.0
    after_tax_payout_month = 0
    after_tax_payout_found = False
    taxed_flow: list[MonthlyCashFlow] = []

    for i, f in enumerate(flow):
        severance_tax = f.revenue * (tax.severanceTaxPct / 100.0)
        ad_valorem_tax = f.capex * (tax.adValoremTaxPct / 100.0)
        pre_tax_income = f.netCashFlow - severance_tax - ad_valorem_tax
        depletion_raw = f.revenue * (tax.depletionAllowancePct / 100.0)
        depletion_allowance = min(depletion_raw, max(0.0, pre_tax_income * 0.65))
        taxable_income = max(0.0, pre_tax_income - depletion_allowance)
        income_tax = taxable_income * ((tax.federalTaxRate + tax.stateTaxRate) / 100.0)
        after_tax_cash_flow = pre_tax_income - income_tax

        cumulative_after_tax += after_tax_cash_flow
        after_tax_npv += after_tax_cash_flow / math.pow(1 + monthly_discount_rate, i + 1)
        if (not after_tax_payout_found) and cumulative_after_tax >= 0:
            after_tax_payout_month = i + 1
            after_tax_payout_found = True

        next_flow = f.model_copy(deep=True)
        next_flow.severanceTax = severance_tax
        next_flow.adValoremTax = ad_valorem_tax
        next_flow.incomeTax = income_tax
        next_flow.afterTaxCashFlow = after_tax_cash_flow
        next_flow.cumulativeAfterTaxCashFlow = cumulative_after_tax
        taxed_flow.append(next_flow)

    next_metrics = metrics.model_copy(deep=True)
    next_metrics.afterTaxNpv10 = after_tax_npv
    next_metrics.afterTaxPayoutMonths = after_tax_payout_month
    return EconomicsResponse(flow=taxed_flow, metrics=next_metrics)


def apply_debt_layer(
    flow: list[MonthlyCashFlow],
    metrics: DealMetrics,
    debt: DebtAssumptions,
) -> EconomicsResponse:
    monthly_discount_rate = 0.10 / 12.0
    revolver_monthly_rate = (debt.revolverRate / 100.0) / 12.0
    term_monthly_rate = (debt.termLoanRate / 100.0) / 12.0
    term_monthly_payment = (
        (debt.termLoanAmount * term_monthly_rate)
        / (1 - math.pow(1 + term_monthly_rate, -debt.termLoanAmortMonths))
        if debt.termLoanAmount > 0 and debt.termLoanAmortMonths > 0
        else 0.0
    )

    revolver_balance = 0.0
    term_balance = debt.termLoanAmount
    cumulative_levered = 0.0
    levered_npv = 0.0
    total_debt_service = 0.0
    total_cash_available = 0.0
    levered_flow: list[MonthlyCashFlow] = []

    for i, f in enumerate(flow):
        base_cf = f.afterTaxCashFlow if f.afterTaxCashFlow is not None else f.netCashFlow
        revolver_interest = revolver_balance * revolver_monthly_rate
        term_interest = term_balance * term_monthly_rate
        total_interest = revolver_interest + term_interest
        term_principal = (
            min(term_balance, max(0.0, term_monthly_payment - term_interest))
            if term_balance > 0
            else 0.0
        )
        cash_after_service = base_cf - total_interest - term_principal
        revolver_paydown = (
            min(revolver_balance, cash_after_service * (debt.cashSweepPct / 100.0))
            if cash_after_service > 0 and revolver_balance > 0
            else 0.0
        )
        revolver_draw = (
            min(abs(cash_after_service), debt.revolverSize - revolver_balance)
            if cash_after_service < 0
            else 0.0
        )

        revolver_balance = revolver_balance - revolver_paydown + revolver_draw
        term_balance = max(0.0, term_balance - term_principal)
        total_principal = term_principal + revolver_paydown
        levered_cash_flow = base_cf - total_interest - total_principal + revolver_draw

        cumulative_levered += levered_cash_flow
        levered_npv += levered_cash_flow / math.pow(1 + monthly_discount_rate, i + 1)
        if base_cf > 0:
            total_cash_available += base_cf
        total_debt_service += total_interest + total_principal

        next_flow = f.model_copy(deep=True)
        next_flow.interestExpense = total_interest
        next_flow.principalPayment = total_principal
        next_flow.leveredCashFlow = levered_cash_flow
        next_flow.cumulativeLeveredCashFlow = cumulative_levered
        next_flow.outstandingDebt = revolver_balance + term_balance
        levered_flow.append(next_flow)

    next_metrics = metrics.model_copy(deep=True)
    next_metrics.leveredNpv10 = levered_npv
    next_metrics.dscr = total_cash_available / total_debt_service if total_debt_service > 0 else 0.0
    next_metrics.equityIrr = 0.0
    return EconomicsResponse(flow=levered_flow, metrics=next_metrics)


def apply_reserves_risk(metrics: DealMetrics, reserve_category: ReserveCategory) -> DealMetrics:
    risk_factor = DEFAULT_RESERVE_RISK_FACTORS.get(reserve_category, 1.0)
    next_metrics = metrics.model_copy(deep=True)
    next_metrics.riskedEur = metrics.eur * risk_factor
    next_metrics.riskedNpv10 = metrics.npv10 * risk_factor
    return next_metrics


def aggregate_economics(groups: list[WellGroup]) -> EconomicsResponse:
    months_to_project = 120
    aggregated_flow = [
        MonthlyCashFlow(
            month=t,
            date=f"Month {t}",
            oilProduction=0.0,
            gasProduction=0.0,
            revenue=0.0,
            capex=0.0,
            opex=0.0,
            netCashFlow=0.0,
            cumulativeCashFlow=0.0,
        )
        for t in range(1, months_to_project + 1)
    ]

    total_capex = 0.0
    total_eur = 0.0
    total_npv10 = 0.0
    total_well_count = 0

    for group in groups:
        if not group.flow or not group.metrics:
            continue
        total_capex += group.metrics.totalCapex
        total_eur += group.metrics.eur
        total_npv10 += group.metrics.npv10
        total_well_count += group.metrics.wellCount

        for i, f in enumerate(group.flow):
            if i >= len(aggregated_flow):
                break
            agg = aggregated_flow[i]
            agg.oilProduction += f.oilProduction
            agg.gasProduction += f.gasProduction
            agg.revenue += f.revenue
            agg.capex += f.capex
            agg.opex += f.opex
            agg.netCashFlow += f.netCashFlow

    cumulative = 0.0
    payout_month = 0
    payout_found = False
    for f in aggregated_flow:
        cumulative += f.netCashFlow
        f.cumulativeCashFlow = cumulative
        if (not payout_found) and cumulative >= 0:
            payout_month = f.month
            payout_found = True

    return EconomicsResponse(
        flow=aggregated_flow,
        metrics=DealMetrics(
            totalCapex=total_capex,
            eur=total_eur,
            npv10=total_npv10,
            irr=0.0,
            payoutMonths=payout_month,
            wellCount=total_well_count,
        ),
    )
