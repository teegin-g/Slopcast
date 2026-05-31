"""
Generator script for TS↔Python economics parity golden file.

Usage (from repo root):
    python3 -m backend.scripts.gen_parity_golden

Reads:  fixtures/economics/dual-parity-rich.json
Writes: fixtures/economics/dual-parity-golden.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    fixture_path = REPO_ROOT / "fixtures" / "economics" / "dual-parity-rich.json"
    output_path = REPO_ROOT / "fixtures" / "economics" / "dual-parity-golden.json"

    with fixture_path.open() as f:
        fixture = json.load(f)

    inp = fixture["input"]

    # Import inside function so the script fails loudly if backend deps are missing.
    from backend.models import (
        CapexAssumptions,
        DebtAssumptions,
        OpexAssumptions,
        OwnershipAssumptions,
        PricingAssumptions,
        Scalars,
        ScheduleParams,
        TaxAssumptions,
        TypeCurveParams,
        Well,
    )
    from backend.economics import calculate_economics

    wells = [Well(**w) for w in inp["wells"]]
    tc = TypeCurveParams(**inp["typeCurve"])
    capex = CapexAssumptions(**inp["capex"])
    pricing = PricingAssumptions(**inp["pricing"])
    opex = OpexAssumptions(**inp["opex"])
    ownership = OwnershipAssumptions(**inp["ownership"])
    scalars = Scalars(**inp["scalars"])
    schedule_override = ScheduleParams(**inp["scheduleOverride"]) if inp.get("scheduleOverride") else None
    tax_assumptions = TaxAssumptions(**inp["taxAssumptions"]) if inp.get("taxAssumptions") else None
    debt_assumptions = DebtAssumptions(**inp["debtAssumptions"]) if inp.get("debtAssumptions") else None
    reserve_category = inp.get("reserveCategory")

    result = calculate_economics(
        selected_wells=wells,
        tc=tc,
        capex=capex,
        pricing=pricing,
        opex=opex,
        ownership=ownership,
        scalars=scalars,
        schedule_override=schedule_override,
        tax_assumptions=tax_assumptions,
        debt_assumptions=debt_assumptions,
        reserve_category=reserve_category,
    )

    metrics = result.metrics

    # Extract exactly the metrics the parity test checks (from economics.parity.test.ts):
    #   totalCapex, eur, npv10, payoutMonths, wellCount,
    #   afterTaxNpv10, afterTaxPayoutMonths, leveredNpv10, dscr, riskedEur, riskedNpv10
    golden_metrics = {
        "totalCapex": metrics.totalCapex,
        "eur": metrics.eur,
        "npv10": metrics.npv10,
        "irr": metrics.irr,
        "payoutMonths": metrics.payoutMonths,
        "wellCount": metrics.wellCount,
        "afterTaxNpv10": metrics.afterTaxNpv10,
        "afterTaxPayoutMonths": metrics.afterTaxPayoutMonths,
        "leveredNpv10": metrics.leveredNpv10,
        "equityIrr": metrics.equityIrr,
        "dscr": metrics.dscr,
        "riskedEur": metrics.riskedEur,
        "riskedNpv10": metrics.riskedNpv10,
    }

    # First 12 monthly flow rows — same fields the test checks per-row
    first12: list[dict] = []
    for flow_row in result.flow[:12]:
        first12.append({
            "month": flow_row.month,
            "oilProduction": flow_row.oilProduction,
            "gasProduction": flow_row.gasProduction,
            "revenue": flow_row.revenue,
            "capex": flow_row.capex,
            "opex": flow_row.opex,
            "netCashFlow": flow_row.netCashFlow,
            "cumulativeCashFlow": flow_row.cumulativeCashFlow,
            "afterTaxCashFlow": flow_row.afterTaxCashFlow,
            "leveredCashFlow": flow_row.leveredCashFlow,
            "outstandingDebt": flow_row.outstandingDebt,
        })

    golden = {
        "generatedBy": "backend/scripts/gen_parity_golden.py",
        "sourceFixture": "fixtures/economics/dual-parity-rich.json",
        "metrics": golden_metrics,
        "first12MonthlyFlow": first12,
    }

    with output_path.open("w") as f:
        json.dump(golden, f, indent=2)

    print(f"Written: {output_path}")
    print(f"Metrics: {json.dumps(golden_metrics, indent=2)}")


if __name__ == "__main__":
    main()
