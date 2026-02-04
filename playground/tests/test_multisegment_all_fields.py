"""
Comprehensive tests verifying all required output fields are correctly calculated.
"""
import math

import numpy as np

from playground.decline_multiseg import SegmentSpec, simulate_multisegment


def test_rate_and_cum_are_present_and_nonzero():
    """Verify rate and cumulative production fields exist and have valid values."""
    out = simulate_multisegment(
        [SegmentSpec(method="Exp", duration=1.0, params={"qi": 1000.0, "Di": 0.5})],
        frequency="monthly",
    )
    assert "rate" in out
    assert "cum" in out
    assert out["rate"][0] == 1000.0
    assert out["cum"][0] == 0.0
    assert out["cum"][-1] > 0.0
    assert np.all(out["rate"] > 0)
    assert np.all(out["cum"] >= 0)


def test_segment_field_tracks_current_segment():
    """Verify segment field correctly identifies which segment each time point belongs to."""
    segments = [
        SegmentSpec(method="Exp", duration=1.0, params={"qi": 800.0, "Di": 1.0}),
        SegmentSpec(method="Flat", duration=1.0, params={}),
        SegmentSpec(method="Linear", duration=1.0, params={"qf": 100.0}),
    ]
    out = simulate_multisegment(segments, frequency="monthly")

    assert "segment" in out
    seg = out["segment"]
    t_years = out["t_years"]

    # First time point should be segment 1
    assert seg[0] == 1

    # Find transitions
    seg1_mask = (t_years >= 0.0) & (t_years < 1.0)
    seg2_mask = (t_years >= 1.0) & (t_years < 2.0)
    seg3_mask = t_years >= 2.0

    assert np.all(seg[seg1_mask] == 1)
    assert np.all(seg[seg2_mask] == 2)
    assert np.all(seg[seg3_mask] == 3)


def test_method_field_tracks_calculation_method():
    """Verify method field correctly identifies the decline method for each time point."""
    segments = [
        SegmentSpec(method="Hyperbolic", duration=1.0, params={"qi": 1000.0, "b": 1.2, "Di": 1.0}),
        SegmentSpec(method="Exp", duration=1.0, params={"Di": 0.5}),
        SegmentSpec(method="Harmonic", duration=0.5, params={"Di": 0.3}),
        SegmentSpec(method="Linear", duration=0.5, params={"qf": 50.0}),
        SegmentSpec(method="Flat", duration=0.5, params={}),
    ]
    out = simulate_multisegment(segments, frequency="monthly")

    assert "method" in out
    methods = out["method"]
    t_years = out["t_years"]

    # Check each segment has the correct method
    assert methods[0] == "Hyperbolic"
    assert methods[(t_years >= 1.0) & (t_years < 2.0)][0] == "Exp"
    assert methods[(t_years >= 2.0) & (t_years < 2.5)][0] == "Harmonic"
    assert methods[(t_years >= 2.5) & (t_years < 3.0)][0] == "Linear"
    assert methods[t_years >= 3.0][0] == "Flat"


def test_secant_effective_and_nominal_decline_rates():
    """Verify secant effective and nominal decline rates are calculated and tracked."""
    # For exponential decline, nominal decline should equal Di
    Di = 0.8
    out = simulate_multisegment(
        [SegmentSpec(method="Exp", duration=1.0, params={"qi": 1000.0, "Di": Di})],
        frequency="monthly",
    )

    assert "secant_nominal_pct_per_year" in out
    assert "secant_effective_pct_per_year" in out

    nom = out["secant_nominal_pct_per_year"]
    eff = out["secant_effective_pct_per_year"]

    # First point should be zero (no previous point)
    assert nom[0] == 0.0
    assert eff[0] == 0.0

    # Subsequent points should have valid decline rates
    assert np.all(nom[1:] > 0)
    assert np.all(eff[1:] > 0)

    # For exponential, nominal decline should be constant and equal to Di
    assert np.allclose(nom[1:] / 100.0, Di, rtol=0, atol=1e-9)

    # Effective decline should also be constant for exponential
    expected_eff = (1.0 - math.exp(-Di)) * 100.0
    assert np.allclose(eff[1:], expected_eff, rtol=0, atol=1e-9)


def test_rate_change_absolute():
    """Verify rate_change field correctly calculates absolute change in rate."""
    out = simulate_multisegment(
        [SegmentSpec(method="Exp", duration=1.0, params={"qi": 1000.0, "Di": 1.0})],
        frequency="monthly",
    )

    assert "rate_change" in out
    rate_change = out["rate_change"]
    rate = out["rate"]

    # First point should have zero change
    assert rate_change[0] == 0.0

    # For declining production, all changes should be negative
    assert np.all(rate_change[1:] < 0)

    # Verify it matches manual calculation
    expected_change = np.zeros_like(rate)
    expected_change[1:] = rate[1:] - rate[:-1]
    assert np.allclose(rate_change, expected_change, rtol=0, atol=1e-12)


def test_rate_pct_change_step():
    """Verify rate_pct_change_step calculates percentage change from previous step."""
    out = simulate_multisegment(
        [SegmentSpec(method="Exp", duration=1.0, params={"qi": 1000.0, "Di": 0.5})],
        frequency="monthly",
    )

    assert "rate_pct_change_step" in out
    pct_change = out["rate_pct_change_step"]
    rate = out["rate"]

    # First point should have zero change
    assert pct_change[0] == 0.0

    # For declining production, all percentage changes should be negative
    assert np.all(pct_change[1:] < 0)

    # Verify manual calculation for a few points
    for i in range(1, min(5, len(rate))):
        expected = 100.0 * (rate[i] - rate[i - 1]) / rate[i - 1]
        assert math.isclose(pct_change[i], expected, rel_tol=0, abs_tol=1e-10)


def test_rate_pct_change_from_start_cumulative():
    """Verify rate_pct_change_from_start calculates cumulative % change from initial rate."""
    qi = 1000.0
    out = simulate_multisegment(
        [SegmentSpec(method="Exp", duration=1.0, params={"qi": qi, "Di": 1.0})],
        frequency="monthly",
    )

    assert "rate_pct_change_from_start" in out
    cum_pct_change = out["rate_pct_change_from_start"]
    rate = out["rate"]

    # First point should be zero (0% change from itself)
    assert cum_pct_change[0] == 0.0

    # All subsequent points should be negative (decline)
    assert np.all(cum_pct_change[1:] < 0)

    # Last point should show significant decline
    assert cum_pct_change[-1] < -50.0  # More than 50% decline over 1 year at Di=1.0

    # Verify manual calculation
    expected = 100.0 * (rate / qi - 1.0)
    assert np.allclose(cum_pct_change, expected, rtol=0, atol=1e-10)


def test_all_required_fields_present():
    """Verify all required fields are present in output."""
    out = simulate_multisegment(
        [SegmentSpec(method="Exp", duration=1.0, params={"qi": 1000.0, "Di": 0.5})],
        frequency="daily",
    )

    required_fields = {
        "t_years",
        "t_days",
        "rate",
        "cum",
        "segment",
        "method",
        "secant_effective_pct_per_year",
        "secant_nominal_pct_per_year",
        "rate_change",
        "rate_pct_change_step",
        "rate_pct_change_from_start",
    }

    assert required_fields.issubset(set(out.keys())), f"Missing fields: {required_fields - set(out.keys())}"


def test_multisegment_all_fields_integration():
    """Integration test with multiple segments verifying all fields work together."""
    segments = [
        SegmentSpec(method="Hyperbolic", duration=2.0, params={"qi": 1200.0, "b": 1.5, "Di": 1.8}),
        SegmentSpec(method="Exp", duration=2.0, params={"Di": 0.4}),
        SegmentSpec(method="Flat", duration=1.0, params={}),
    ]
    out = simulate_multisegment(segments, frequency="daily")

    # Verify all arrays have same length
    n = len(out["t_years"])
    for key, val in out.items():
        assert len(val) == n, f"Field {key} has different length"

    # Verify rate is always positive
    assert np.all(out["rate"] > 0)

    # Verify cum is monotonically increasing
    assert np.all(np.diff(out["cum"]) >= 0)

    # Verify segments are sequential
    seg = out["segment"]
    assert seg[0] == 1
    assert np.all(np.diff(seg) >= 0)  # Non-decreasing
    assert seg[-1] == 3

    # Verify methods match segments
    t_years = out["t_years"]
    assert out["method"][0] == "Hyperbolic"
    assert out["method"][(t_years >= 2.0) & (t_years < 4.0)][0] == "Exp"
    assert out["method"][t_years >= 4.0][0] == "Flat"

    # Verify decline rates are reasonable
    nom = out["secant_nominal_pct_per_year"]
    eff = out["secant_effective_pct_per_year"]
    assert np.all(nom[1:] >= 0)  # Decline rates should be non-negative
    assert np.all(eff[1:] >= 0)

    # Verify percentage changes are reasonable
    assert out["rate_pct_change_from_start"][0] == 0.0
    assert out["rate_pct_change_from_start"][-1] < 0.0  # Should decline overall
