import math

import numpy as np

from playground.decline_multiseg import SegmentSpec, simulate_multisegment


def test_multisegment_outputs_columns_and_length_monthly_grid():
    segments = [
        SegmentSpec(method="Exp", duration=1.0, params={"qi": 1000.0, "Di": 1.0}),
        SegmentSpec(method="Flat", duration=1.0, params={}),
    ]
    out = simulate_multisegment(segments, dt_years=1.0 / 12.0)

    expected_cols = {
        "t_years",
        "segment",
        "method",
        "rate",
        "cum",
        "rate_change",
        "rate_pct_change_step",
        "rate_pct_change_from_start",
        "secant_effective_pct_per_year",
        "secant_nominal_pct_per_year",
    }
    assert expected_cols.issubset(set(out.keys()))

    # 0..1.0 inclusive on 1/12 grid => 13 points, then 12 more to 2.0 => 25 total
    assert out["t_years"].shape == (25,)
    assert np.isclose(out["t_years"][0], 0.0)
    assert np.isclose(out["t_years"][-1], 2.0)


def test_segment_transition_is_continuous_at_boundary():
    segments = [
        SegmentSpec(method="Exp", duration=1.0, params={"qi": 800.0, "Di": 0.8}),
        SegmentSpec(method="Harmonic", duration=1.0, params={"Di": 0.5}),
    ]
    out = simulate_multisegment(segments, dt_years=1.0 / 12.0)

    # Boundary is at exactly t=1.0 years.
    idx = int(np.where(np.round(out["t_years"], 12) == 1.0)[0][0])
    assert out["segment"][idx] == 2
    # Continuity: segment 2 starts at the segment-1 end rate (at t=1.0).
    expected_end_rate_seg1 = 800.0 * math.exp(-0.8 * 1.0)
    assert math.isclose(out["rate"][idx], expected_end_rate_seg1, rel_tol=0, abs_tol=1e-12)


def test_secant_nominal_matches_exponential_Di_and_effective_is_constant():
    Di = 1.1
    dt = 1.0 / 12.0
    segments = [SegmentSpec(method="Exp", duration=1.0, params={"qi": 1000.0, "Di": Di})]
    out = simulate_multisegment(segments, dt_years=dt)

    # For exp: q2/q1 = exp(-Di*dt) => secant nominal = Di
    nom = out["secant_nominal_pct_per_year"]
    eff = out["secant_effective_pct_per_year"]

    # ignore t=0 entry (0 by definition)
    assert np.allclose(nom[1:] / 100.0, Di, rtol=0, atol=1e-10)
    expected_eff = (1.0 - math.exp(-Di)) * 100.0
    assert np.allclose(eff[1:], expected_eff, rtol=0, atol=1e-10)


def test_linear_segment_hits_qf_at_end():
    segments = [
        SegmentSpec(method="Linear", duration=1.0, params={"qi": 1000.0, "qf": 500.0}),
    ]
    out = simulate_multisegment(segments, dt_years=1.0 / 12.0)
    assert math.isclose(out["rate"][0], 1000.0, rel_tol=0, abs_tol=1e-12)
    assert math.isclose(out["rate"][-1], 500.0, rel_tol=0, abs_tol=1e-12)

