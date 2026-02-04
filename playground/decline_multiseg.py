from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Literal, Mapping, Optional, Sequence, Tuple

import numpy as np


def exponential_rate(qi: float, Di: float, t: np.ndarray) -> np.ndarray:
    """
    Arps exponential decline:
        q(t) = qi * exp(-Di * t)
    """
    t = np.asarray(t, dtype=float)
    qi = float(qi)
    Di = float(Di)
    if Di < 0:
        raise ValueError("Di must be >= 0")
    return qi * np.exp(-Di * t)


def hyperbolic_rate(qi: float, b: float, Di: float, t: np.ndarray) -> np.ndarray:
    """
    Arps hyperbolic decline:
        q(t) = qi / (1 + b * Di * t) ** (1 / b)
    """
    t = np.asarray(t, dtype=float)
    qi = float(qi)
    b = float(b)
    Di = float(Di)
    if Di < 0:
        raise ValueError("Di must be >= 0")
    if b < 0:
        raise ValueError("b must be >= 0")

    eps = 1e-12
    if abs(b) < eps:
        return exponential_rate(qi, Di, t)
    return qi / np.power(1.0 + b * Di * t, 1.0 / b)


def linear_rate(qi: float, qf: float, t: np.ndarray, t_end: float) -> np.ndarray:
    """
    Linear interpolation from qi at t=0 to qf at t=t_end:
        q(t) = qi + (qf - qi) * (t / t_end)
    """
    t = np.asarray(t, dtype=float)
    qi = float(qi)
    qf = float(qf)
    t_end = float(t_end)
    if t_end <= 0:
        raise ValueError("t_end must be > 0")
    return qi + (qf - qi) * (t / t_end)


def flat_rate(qi: float, t: np.ndarray) -> np.ndarray:
    """Flat rate q(t)=qi."""
    t = np.asarray(t, dtype=float)
    qi = float(qi)
    return np.full_like(t, qi, dtype=float)


def power_law_rate(qi: float, m: float, tau: float, t: np.ndarray) -> np.ndarray:
    """
    Power-law decline:
        q(t) = qi / (1 + t / tau) ** m
    """
    t = np.asarray(t, dtype=float)
    qi = float(qi)
    m = float(m)
    tau = float(tau)
    if m < 0:
        raise ValueError("m must be >= 0")
    if tau <= 0:
        raise ValueError("tau must be > 0")
    return qi / np.power(1.0 + (t / tau), m)


MethodName = Literal["Exp", "Hyperbolic", "Harmonic", "Linear", "Flat", "PowerLaw"]


@dataclass(frozen=True)
class SegmentSpec:
    method: MethodName
    duration: float  # time units must match dt_years and parameters
    params: Mapping[str, Any]


def _validate_segments(segments: Sequence[SegmentSpec], *, dt: float) -> None:
    if not segments:
        raise ValueError("segments must be non-empty")
    if dt <= 0:
        raise ValueError("dt must be > 0")
    for i, seg in enumerate(segments, start=1):
        if seg.duration <= 0:
            raise ValueError(f"segment {i} duration must be > 0")
        # Require first segment to specify qi.
        if i == 1 and "qi" not in seg.params:
            raise ValueError("first segment params must include qi")


def _segment_rate(
    *,
    method: MethodName,
    qi: float,
    t_local: np.ndarray,
    duration: float,
    params: Mapping[str, Any],
) -> np.ndarray:
    if method == "Exp":
        return exponential_rate(qi, float(params["Di"]), t_local)
    if method == "Hyperbolic":
        return hyperbolic_rate(qi, float(params["b"]), float(params["Di"]), t_local)
    if method == "Harmonic":
        # Harmonic is hyperbolic with b=1
        return hyperbolic_rate(qi, 1.0, float(params["Di"]), t_local)
    if method == "Linear":
        return linear_rate(qi, float(params["qf"]), t_local, float(duration))
    if method == "Flat":
        return flat_rate(qi, t_local)
    if method == "PowerLaw":
        return power_law_rate(qi, float(params["m"]), float(params["tau"]), t_local)
    raise ValueError(f"Unknown method: {method}")


def simulate_multisegment(
    segments: Sequence[SegmentSpec],
    *,
    dt_years: float = 1.0 / 12.0,
) -> Dict[str, np.ndarray]:
    """
    Build a multi-segment decline model and return per-time calculated data.

    Output columns (per time t, in years):
      - t_years
      - segment (1-indexed)
      - method
      - rate
      - cum (trapezoidal integral of rate over time)
      - rate_change (Δq vs previous time step; 0 at t=0)
      - rate_pct_change_step (Δq / q_prev * 100; 0 at t=0)
      - rate_pct_change_from_start ((q / q0 - 1) * 100)
      - secant_nominal_pct_per_year (-ln(q/q_prev)/dt * 100; 0 at t=0)
      - secant_effective_pct_per_year ((1 - (q/q_prev)^(1/dt)) * 100; 0 at t=0)
    """
    dt = float(dt_years)
    _validate_segments(segments, dt=dt)

    t_all: List[float] = []
    seg_all: List[int] = []
    method_all: List[str] = []
    rate_all: List[float] = []

    t_cursor = 0.0
    q_start = float(segments[0].params["qi"])
    if q_start < 0:
        raise ValueError("qi must be >= 0")

    n_segments = len(segments)
    for seg_idx, seg in enumerate(segments, start=1):
        # Store times for this segment *excluding* the end boundary time.
        # The end boundary time (t=duration) is owned by the next segment (except for the last segment),
        # which avoids duplicates and makes "current segment" unambiguous at boundaries.
        t_local_store = np.arange(0.0, float(seg.duration), dt, dtype=float)

        # For the last segment, include the final endpoint.
        if seg_idx == n_segments:
            if t_local_store.size == 0 or abs(t_local_store[-1] - float(seg.duration)) > 1e-12:
                t_local_store = np.append(t_local_store, float(seg.duration))

        if t_local_store.size:
            q_store = _segment_rate(
                method=seg.method,
                qi=q_start,
                t_local=t_local_store,
                duration=float(seg.duration),
                params=seg.params,
            )

            t_global = t_cursor + t_local_store
            t_all.extend(t_global.tolist())
            rate_all.extend(q_store.astype(float).tolist())
            seg_all.extend([seg_idx] * t_local_store.size)
            method_all.extend([seg.method] * t_local_store.size)

        # Always compute the boundary end rate at t=duration to seed the next segment.
        q_end = _segment_rate(
            method=seg.method,
            qi=q_start,
            t_local=np.asarray([float(seg.duration)], dtype=float),
            duration=float(seg.duration),
            params=seg.params,
        )
        q_start = float(q_end[-1])
        t_cursor += float(seg.duration)

    if not t_all:
        raise ValueError("No times were generated; check segment durations and dt_years")

    t = np.asarray(t_all, dtype=float)
    rate = np.asarray(rate_all, dtype=float)
    seg_arr = np.asarray(seg_all, dtype=int)
    method_arr = np.asarray(method_all, dtype=object)

    # Cumulative via trapezoidal integration
    cum = np.zeros_like(rate, dtype=float)
    dt_steps = np.diff(t)
    if dt_steps.size:
        cum[1:] = np.cumsum(0.5 * (rate[:-1] + rate[1:]) * dt_steps)

    rate_change = np.zeros_like(rate, dtype=float)
    rate_change[1:] = rate[1:] - rate[:-1]

    rate_pct_change_step = np.zeros_like(rate, dtype=float)
    with np.errstate(divide="ignore", invalid="ignore"):
        step = np.where(rate[:-1] != 0, (rate[1:] - rate[:-1]) / rate[:-1], 0.0)
    rate_pct_change_step[1:] = 100.0 * step

    q0 = float(rate[0])
    rate_pct_change_from_start = np.zeros_like(rate, dtype=float)
    if q0 != 0:
        rate_pct_change_from_start = 100.0 * (rate / q0 - 1.0)

    secant_nominal_pct_per_year = np.zeros_like(rate, dtype=float)
    secant_effective_pct_per_year = np.zeros_like(rate, dtype=float)
    for i in range(1, rate.size):
        q_prev = float(rate[i - 1])
        q_cur = float(rate[i])
        dt_i = float(t[i] - t[i - 1])
        if dt_i <= 0 or q_prev <= 0 or q_cur <= 0:
            continue
        # Nominal: D = -ln(q2/q1)/Δt
        d_nom = -math.log(q_cur / q_prev) / dt_i
        secant_nominal_pct_per_year[i] = 100.0 * d_nom
        # Effective annual: De = 1 - (q2/q1)^(1/Δt)
        de_eff = 1.0 - math.exp(math.log(q_cur / q_prev) / dt_i)
        secant_effective_pct_per_year[i] = 100.0 * de_eff

    return {
        "t_years": t,
        "segment": seg_arr,
        "method": method_arr,
        "rate": rate,
        "cum": cum,
        "rate_change": rate_change,
        "rate_pct_change_step": rate_pct_change_step,
        "rate_pct_change_from_start": rate_pct_change_from_start,
        "secant_effective_pct_per_year": secant_effective_pct_per_year,
        "secant_nominal_pct_per_year": secant_nominal_pct_per_year,
    }


def multisegment_to_dataframe(data: Mapping[str, np.ndarray]):
    """
    Convert `simulate_multisegment` output to a pandas DataFrame.

    Kept as an optional helper so the core simulator remains pandas-free (tests run
    under the repo's default python deps).
    """
    import pandas as pd  # optional dependency (present in playground notebooks env)

    return pd.DataFrame(dict(data))

