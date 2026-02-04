import math

import numpy as np

from playground.decline_multiseg import SegmentSpec, simulate_multisegment


DAYS_PER_YEAR = 365.25


def _trapz_cum(rate: np.ndarray, t_days: np.ndarray) -> np.ndarray:
    cum = np.zeros_like(rate, dtype=float)
    dt = np.diff(t_days)
    if dt.size:
        cum[1:] = np.cumsum(0.5 * (rate[:-1] + rate[1:]) * dt)
    return cum


def test_daily_frequency_has_daily_steps_and_partial_last_day():
    # 1 year = 365.25 days. With daily stepping we should get day 0..365 plus a final 365.25 endpoint.
    out = simulate_multisegment(
        [SegmentSpec(method="Flat", duration=1.0, params={"qi": 100.0})],
        frequency="daily",
    )
    t_days = out["t_days"]
    assert math.isclose(t_days[0], 0.0, rel_tol=0, abs_tol=1e-12)
    assert math.isclose(t_days[-1], 365.25, rel_tol=0, abs_tol=1e-12)
    # 0..365 inclusive => 366 points, plus final 365.25 => 367
    assert t_days.shape == (367,)
    # First steps are exactly 1 day.
    assert np.allclose(np.diff(t_days[:10]), 1.0, rtol=0, atol=1e-12)
    # Last step is the fractional 0.25 day.
    assert math.isclose(t_days[-1] - t_days[-2], 0.25, rel_tol=0, abs_tol=1e-12)


def test_cumulative_production_flat_daily_is_rate_times_days():
    qi = 250.0  # interpret as bbl/day
    out = simulate_multisegment(
        [SegmentSpec(method="Flat", duration=1.0, params={"qi": qi})],
        frequency="daily",
    )
    # cum is in rate*days => bbl for bbl/day
    assert math.isclose(out["cum"][-1], qi * DAYS_PER_YEAR, rel_tol=0, abs_tol=1e-10)


def test_cum_uses_days_not_years_scaling_exponential_daily():
    qi = 1000.0
    Di = 1.2  # nominal per-year
    out = simulate_multisegment(
        [SegmentSpec(method="Exp", duration=1.0, params={"qi": qi, "Di": Di})],
        frequency="daily",
    )

    t_years = out["t_years"]
    t_days = out["t_days"]

    expected_rate = qi * np.exp(-Di * t_years)
    expected_cum = _trapz_cum(expected_rate, t_days)

    assert np.allclose(out["rate"], expected_rate, rtol=0, atol=1e-12)
    # If cum were incorrectly integrating over years, it would be ~365.25x smaller.
    assert np.allclose(out["cum"], expected_cum, rtol=0, atol=1e-10)

