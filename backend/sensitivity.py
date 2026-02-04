from __future__ import annotations

from .economics import calculate_economics
from .models import (
    PricingAssumptions,
    Scalars,
    ScheduleParams,
    SensitivityMatrixResult,
    SensitivityVariable,
    Well,
    WellGroup,
)


def _get_params_for_step(
    *,
    variable: SensitivityVariable,
    value: float,
    current_scalars: Scalars,
    current_pricing: PricingAssumptions,
    current_schedule: ScheduleParams,
) -> tuple[Scalars, PricingAssumptions, ScheduleParams]:
    # Mirrors TS helper `getParamsForStep`
    new_scalars = current_scalars.model_copy(deep=True)
    new_pricing = current_pricing.model_copy(deep=True)
    new_schedule = current_schedule.model_copy(deep=True)

    if variable == "OIL_PRICE":
        new_pricing.oilPrice = value
    if variable == "CAPEX_SCALAR":
        new_scalars.capex = value
    if variable == "EUR_SCALAR":
        new_scalars.production = value
    if variable == "RIG_COUNT":
        # For Matrix, apply flat rig count override to the whole schedule array
        new_schedule.annualRigs = [value for _ in range(10)]

    return new_scalars, new_pricing, new_schedule


def generate_sensitivity_matrix(
    base_groups: list[WellGroup],
    wells: list[Well],
    x_var: SensitivityVariable,
    x_steps: list[float],
    y_var: SensitivityVariable,
    y_steps: list[float],
) -> list[list[SensitivityMatrixResult]]:
    """
    Python port of `utils/economics.ts::generateSensitivityMatrix` (keep parity).
    """
    matrix: list[list[SensitivityMatrixResult]] = []

    # Rows (Y)
    for y_val in y_steps:
        row: list[SensitivityMatrixResult] = []

        # Cols (X)
        for x_val in x_steps:
            portfolio_npv = 0.0

            for group in base_groups:
                group_well_ids = set(group.wellIds)
                group_wells = [w for w in wells if w.id in group_well_ids]

                scalars = Scalars(capex=1.0, production=1.0)
                pricing = group.pricing.model_copy(deep=True)

                # Construct default schedule from group legacy/default
                schedule = ScheduleParams(
                    annualRigs=[(group.capex.rigCount or 1) for _ in range(10)],
                    drillDurationDays=group.capex.drillDurationDays,
                    stimDurationDays=group.capex.stimDurationDays,
                    rigStartDate=group.capex.rigStartDate,
                )

                # Apply Y then X modification (same order as TS)
                scalars, pricing, schedule = _get_params_for_step(
                    variable=y_var,
                    value=y_val,
                    current_scalars=scalars,
                    current_pricing=pricing,
                    current_schedule=schedule,
                )
                scalars, pricing, schedule = _get_params_for_step(
                    variable=x_var,
                    value=x_val,
                    current_scalars=scalars,
                    current_pricing=pricing,
                    current_schedule=schedule,
                )

                result = calculate_economics(
                    group_wells,
                    group.typeCurve,
                    group.capex,
                    pricing,
                    scalars,
                    schedule,
                )
                portfolio_npv += result.metrics.npv10

            row.append(SensitivityMatrixResult(xValue=x_val, yValue=y_val, npv=portfolio_npv))

        matrix.append(row)

    return matrix

