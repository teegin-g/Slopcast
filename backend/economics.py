from __future__ import annotations

import math

from .models import (
    CapexAssumptions,
    DealMetrics,
    EconomicsResponse,
    MonthlyCashFlow,
    PricingAssumptions,
    Scalars,
    ScheduleParams,
    TypeCurveParams,
    Well,
    WellGroup,
)


def calculate_economics(
    selected_wells: list[Well],
    tc: TypeCurveParams,
    capex: CapexAssumptions,
    pricing: PricingAssumptions,
    scalars: Scalars | None = None,
    schedule_override: ScheduleParams | None = None,
) -> EconomicsResponse:
    """
    Python port of `utils/economics.ts::calculateEconomics` (keep parity).
    """
    months_to_project = 120  # 10 years
    scalars = scalars or Scalars()

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

    # --- 1. Rank Wells ---
    sorted_wells = sorted(selected_wells, key=lambda w: w.lateralLength, reverse=True)

    # --- 2. Schedule Wells ---
    drill_days = (
        schedule_override.drillDurationDays if schedule_override else capex.drillDurationDays
    )
    stim_days = (
        schedule_override.stimDurationDays if schedule_override else capex.stimDurationDays
    )
    cycle_time_months = (drill_days + stim_days) / 30.4

    rig_availability: list[float] = []
    if schedule_override:
        annual_rigs = schedule_override.annualRigs
        # TS parity: `for (let i=0; i<startCount; i++)` means non-integers behave like ceil().
        start_count_raw = annual_rigs[0] if len(annual_rigs) > 0 else 1
        start_count = max(1, int(math.ceil(start_count_raw or 1)))
        rig_availability = [0.0 for _ in range(start_count)]

        # Handle ramps (add rigs in future years; no removals)
        for y in range(1, len(annual_rigs)):
            prev = annual_rigs[y - 1] if annual_rigs[y - 1] is not None else 0
            curr = annual_rigs[y] if annual_rigs[y] is not None else 0
            if curr > prev:
                # TS parity: `for (k=0; k<diff; k++)` behaves like ceil() for non-integers.
                diff = int(math.ceil(curr - prev))
                start_time = y * 12  # start of year y (month 12, 24, ...)
                for _ in range(diff):
                    rig_availability.append(float(start_time))
    else:
        count = max(1, int(round(capex.rigCount)))
        rig_availability = [0.0 for _ in range(count)]

    well_schedules: list[tuple[Well, float]] = []
    for well in sorted_wells:
        best_rig_idx = 0
        for i in range(1, len(rig_availability)):
            if rig_availability[i] < rig_availability[best_rig_idx]:
                best_rig_idx = i
        start_month = rig_availability[best_rig_idx]
        rig_availability[best_rig_idx] += cycle_time_months
        well_schedules.append((well, start_month))

    # --- 3. Generate Cash Flows ---
    aggregated_flow: list[MonthlyCashFlow] = []
    for t in range(1, months_to_project + 24 + 1):
        aggregated_flow.append(
            MonthlyCashFlow(
                month=t,
                date=f"Month {t}",
                oilProduction=0.0,
                revenue=0.0,
                capex=0.0,
                opex=0.0,
                netCashFlow=0.0,
                cumulativeCashFlow=0.0,
            )
        )

    total_capex = 0.0
    total_oil = 0.0

    di_monthly = 1 - math.pow(1 - (tc.di / 100.0), 1 / 12.0)
    b = tc.b
    qi_monthly = tc.qi * 30.4 * scalars.production
    monthly_discount_rate = 0.10 / 12.0

    realized_oil = pricing.oilPrice - (pricing.oilDifferential or 0.0)
    _realized_gas = pricing.gasPrice - (pricing.gasDifferential or 0.0)  # parity; unused

    for well, start_month_offset in well_schedules:
        raw_well_capex = 0.0
        for item in capex.items:
            if item.basis == "PER_FOOT":
                raw_well_capex += item.value * well.lateralLength
            else:
                raw_well_capex += item.value

        well_total_capex = raw_well_capex * scalars.capex
        total_capex += well_total_capex

        prod_start_month_idx = int(math.floor(start_month_offset)) + 1
        capex_month_idx = int(math.floor(start_month_offset))

        if 0 <= capex_month_idx < len(aggregated_flow):
            aggregated_flow[capex_month_idx].capex += well_total_capex

        for t in range(1, months_to_project + 1):
            calendar_month_idx = prod_start_month_idx + t - 1
            if calendar_month_idx >= len(aggregated_flow):
                continue

            if b == 0:
                q_t = qi_monthly * math.exp(-di_monthly * t)
            else:
                q_t = qi_monthly / math.pow(1 + b * di_monthly * t, 1 / b)

            revenue = q_t * realized_oil * pricing.nri
            opex = pricing.loePerMonth

            f = aggregated_flow[calendar_month_idx]
            f.oilProduction += q_t
            f.revenue += revenue
            f.opex += opex

            total_oil += q_t

    # --- 4. Final Metrics ---
    cumulative_cash = 0.0
    npv = 0.0
    payout_month = 0
    payout_found = False

    final_flow = aggregated_flow[:months_to_project]
    for f in final_flow:
        f.netCashFlow = f.revenue - f.opex - f.capex
        cumulative_cash += f.netCashFlow
        f.cumulativeCashFlow = cumulative_cash

        npv += f.netCashFlow / math.pow(1 + monthly_discount_rate, f.month)

        if (not payout_found) and cumulative_cash >= 0:
            payout_month = f.month
            payout_found = True

    return EconomicsResponse(
        flow=final_flow,
        metrics=DealMetrics(
            totalCapex=total_capex,
            eur=total_oil,
            npv10=npv,
            irr=0.0,
            payoutMonths=payout_month,
            wellCount=len(selected_wells),
        ),
    )


def aggregate_economics(groups: list[WellGroup]) -> EconomicsResponse:
    """
    Python port of `utils/economics.ts::aggregateEconomics` (keep parity).
    """
    months_to_project = 120
    aggregated_flow: list[MonthlyCashFlow] = []

    for t in range(1, months_to_project + 1):
        aggregated_flow.append(
            MonthlyCashFlow(
                month=t,
                date=f"Month {t}",
                oilProduction=0.0,
                revenue=0.0,
                capex=0.0,
                opex=0.0,
                netCashFlow=0.0,
                cumulativeCashFlow=0.0,
            )
        )

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

