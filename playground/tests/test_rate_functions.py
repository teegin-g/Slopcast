import math

import numpy as np

from playground.scripts.batch_sensitivity import calculate_type_curve as calculate_type_curve_batch
from playground.scripts.quick_economics import calculate_type_curve as calculate_type_curve_quick


def _expected_rates(qi_bopd: float, b: float, di_annual_decimal: float, months: int) -> np.ndarray:
    """Mirror the current implementation exactly for known-answer assertions."""
    di_monthly = 1 - (1 - di_annual_decimal) ** (1 / 12)
    qi_monthly = qi_bopd * 30.4

    out = []
    for t in range(1, months + 1):
        if b == 0:
            q_t = qi_monthly * math.exp(-di_monthly * t)
        else:
            q_t = qi_monthly / ((1 + b * di_monthly * t) ** (1 / b))
        out.append(q_t)
    return np.array(out, dtype=float)


def _assert_type_curve_matches_expected(fn):
    qi = 1000.0
    di = 0.50  # 50% annual, decimal form (as used by playground scripts)
    months = 6

    for b in (0.0, 1.2):
        got = fn(qi=qi, b=b, di_annual=di, months=months)
        exp = _expected_rates(qi_bopd=qi, b=b, di_annual_decimal=di, months=months)
        assert got.shape == (months,)
        assert np.allclose(got, exp, rtol=0, atol=1e-10)


def test_calculate_type_curve_quick_known_answer():
    _assert_type_curve_matches_expected(calculate_type_curve_quick)


def test_calculate_type_curve_batch_known_answer():
    _assert_type_curve_matches_expected(calculate_type_curve_batch)


def test_calculate_type_curve_monotonic_decline_when_di_positive():
    qi = 1200.0
    di = 0.60
    months = 24

    for fn in (calculate_type_curve_quick, calculate_type_curve_batch):
        for b in (0.0, 0.8, 1.2):
            rates = fn(qi=qi, b=b, di_annual=di, months=months)
            # Strictly decreasing for these parameters (as implemented with t starting at 1)
            assert np.all(np.diff(rates) < 0)


def test_calculate_type_curve_di_zero_is_constant():
    qi = 900.0
    di = 0.0
    months = 12
    qi_monthly = qi * 30.4

    for fn in (calculate_type_curve_quick, calculate_type_curve_batch):
        for b in (0.0, 0.5, 1.2):
            rates = fn(qi=qi, b=b, di_annual=di, months=months)
            assert np.allclose(rates, np.full(months, qi_monthly), rtol=0, atol=1e-12)


def test_calculate_type_curve_months_zero_returns_empty():
    for fn in (calculate_type_curve_quick, calculate_type_curve_batch):
        rates = fn(qi=1000.0, b=1.2, di_annual=0.5, months=0)
        assert isinstance(rates, np.ndarray)
        assert rates.shape == (0,)

