import math

from backend.economics import calculate_economics
from backend.models import CapexAssumptions, PricingAssumptions, TypeCurveParams, Well


def _mk_min_inputs(*, qi: float, b: float, di_percent: float):
    well = Well(
        id="w1",
        name="Test Well",
        lat=0.0,
        lng=0.0,
        lateralLength=10000.0,
        status="PRODUCING",
        operator="TestCo",
    )
    tc = TypeCurveParams(qi=qi, b=b, di=di_percent, terminalDecline=5.0)
    capex = CapexAssumptions(
        rigCount=1.0,
        drillDurationDays=0.0,
        stimDurationDays=0.0,
        rigStartDate="2026-01-01",
        items=[],
    )
    pricing = PricingAssumptions(
        oilPrice=70.0,
        gasPrice=0.0,
        oilDifferential=0.0,
        gasDifferential=0.0,
        nri=1.0,
        loePerMonth=0.0,
    )
    return [well], tc, capex, pricing


def _expected_q_t(*, qi: float, b: float, di_percent: float, t: int) -> float:
    di_monthly = 1 - math.pow(1 - (di_percent / 100.0), 1 / 12.0)
    qi_monthly = qi * 30.4
    if b == 0:
        return qi_monthly * math.exp(-di_monthly * t)
    return qi_monthly / math.pow(1 + b * di_monthly * t, 1 / b)


def test_backend_decline_math_exponential_b0_matches_formula():
    wells, tc, capex, pricing = _mk_min_inputs(qi=1000.0, b=0.0, di_percent=50.0)
    res = calculate_economics(wells, tc, capex, pricing)

    # With the current scheduling/indexing, production begins at flow index 1 (Month 2).
    assert res.flow[0].oilProduction == 0.0
    assert math.isclose(res.flow[1].oilProduction, _expected_q_t(qi=tc.qi, b=tc.b, di_percent=tc.di, t=1), rel_tol=0, abs_tol=1e-10)
    assert math.isclose(res.flow[2].oilProduction, _expected_q_t(qi=tc.qi, b=tc.b, di_percent=tc.di, t=2), rel_tol=0, abs_tol=1e-10)


def test_backend_decline_math_hyperbolic_matches_formula():
    wells, tc, capex, pricing = _mk_min_inputs(qi=1000.0, b=1.2, di_percent=50.0)
    res = calculate_economics(wells, tc, capex, pricing)

    assert res.flow[0].oilProduction == 0.0
    assert math.isclose(res.flow[1].oilProduction, _expected_q_t(qi=tc.qi, b=tc.b, di_percent=tc.di, t=1), rel_tol=0, abs_tol=1e-10)
    assert math.isclose(res.flow[2].oilProduction, _expected_q_t(qi=tc.qi, b=tc.b, di_percent=tc.di, t=2), rel_tol=0, abs_tol=1e-10)

