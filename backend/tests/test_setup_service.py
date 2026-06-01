"""Tests for the Project Setup / Launchpad backend service."""

from __future__ import annotations

import pytest

import backend.setup_service as setup_service
from backend.setup_models import CountRequest, FilterClause
from backend.setup_service import (
    _COUNT_CAP,
    _interpret_heuristic,
    _months_ago_iso,
    build_where,
    estimate_count,
    get_field_stats,
    get_presets,
    get_schema,
)


@pytest.fixture
def offline(monkeypatch):
    """Force the mock path: pretend no live Databricks connection is available.

    The repo .env may carry real credentials, so count/preset tests pin the
    connection to None for deterministic, network-free assertions.
    """
    monkeypatch.setattr(setup_service, "_get_db_connection", lambda: None)


# ---------------------------------------------------------------------------
# Schema catalog
# ---------------------------------------------------------------------------

def test_schema_exposes_core_dropdown_fields():
    schema = get_schema()
    by_name = {f.name: f for f in schema.fields}
    for core in ("basin", "state", "county", "formation", "operator", "well_status"):
        assert core in by_name, f"missing core field {core}"
        assert by_name[core].core is True
    # Categories are ordered and non-empty.
    assert schema.categories[0] == "Location"
    assert schema.table


# ---------------------------------------------------------------------------
# Safe WHERE builder
# ---------------------------------------------------------------------------

def test_build_where_rejects_unknown_fields():
    params: dict[str, object] = {}
    clause = FilterClause(field="evil; DROP TABLE wells", kind="string", text="x")
    where = build_where(None, [clause], params)
    assert where == ""
    assert params == {}


def test_build_where_binds_set_values_as_params():
    params: dict[str, object] = {}
    malicious = "ACME'); DROP TABLE wells; --"
    clause = FilterClause(field="operator", kind="set", values=[malicious])
    where = build_where("permian", [clause], params)

    assert "DROP TABLE" not in where
    assert "UPPER(basin) = %(p_basin)s" in where
    assert params["p_basin"] == "PERMIAN"
    # Value is bound (uppercased), never inlined.
    assert any(v == malicious.upper() for v in params.values())


def test_build_where_numeric_between_orders_bounds():
    params: dict[str, object] = {}
    clause = FilterClause(field="lateral_length", kind="numeric", op="between", value=12000, value2=8000)
    where = build_where(None, [clause], params)
    assert "lateral_length BETWEEN" in where
    lo = params["p_0_lo"]
    hi = params["p_0_hi"]
    assert lo == 8000 and hi == 12000


def test_build_where_numeric_operator_maps_symbol():
    params: dict[str, object] = {}
    clause = FilterClause(field="cum_boe_12mo", kind="numeric", op="gte", value=250000)
    where = build_where(None, [clause], params)
    assert "cum_boe_12mo >= %(p_0_n)s" in where
    assert params["p_0_n"] == 250000


def test_build_where_date_bounds():
    params: dict[str, object] = {}
    clause = FilterClause(field="spud_date", kind="date", start="2022-01-01", end="2023-01-01")
    where = build_where(None, [clause], params)
    assert "spud_date >= %(p_0_ds)s" in where
    assert "spud_date <= %(p_0_de)s" in where
    assert params["p_0_ds"] == "2022-01-01"
    assert params["p_0_de"] == "2023-01-01"


def test_build_where_string_fuzzy_vs_strict():
    fuzzy_params: dict[str, object] = {}
    fuzzy = FilterClause(field="formation", kind="string", text="wolfcamp", match="fuzzy")
    fuzzy_where = build_where(None, [fuzzy], fuzzy_params)
    assert "LIKE" in fuzzy_where
    assert fuzzy_params["p_0_s"] == "%WOLFCAMP%"

    strict_params: dict[str, object] = {}
    strict = FilterClause(field="formation", kind="string", text="wolfcamp a", match="strict")
    strict_where = build_where(None, [strict], strict_params)
    assert "=" in strict_where and "LIKE" not in strict_where
    assert strict_params["p_0_s"] == "WOLFCAMP A"


# ---------------------------------------------------------------------------
# Count estimator (mock path — no live connection in tests)
# ---------------------------------------------------------------------------

def test_estimate_count_caps_unconstrained_universe(offline):
    resp = estimate_count(None, [])
    assert resp.capped is True
    assert resp.estimated is True
    assert resp.count == _COUNT_CAP
    assert resp.source == "mock"


def test_estimate_count_basin_reduces_universe(offline):
    unfiltered = estimate_count("PERMIAN", [])
    filtered = estimate_count(
        "PERMIAN",
        [FilterClause(field="well_status", kind="set", values=["PRODUCING"])],
    )
    assert unfiltered.count < _COUNT_CAP
    assert filtered.count < unfiltered.count
    assert filtered.capped is False


def test_count_request_model_defaults():
    req = CountRequest(basin="permian")
    assert req.filters == []


# ---------------------------------------------------------------------------
# Heuristic NL interpreter
# ---------------------------------------------------------------------------

def test_heuristic_detects_basin_and_formation():
    resp = _interpret_heuristic("permian wolfcamp a wells", None)
    assert resp.basin == "PERMIAN"
    assert any(c.field == "formation" for c in resp.filters)
    assert resp.confidence > 0
    assert resp.source == "mock"


def test_heuristic_numeric_threshold_with_units():
    resp = _interpret_heuristic("wells with cum boe 12mo over 250k", None)
    clause = next(c for c in resp.filters if c.field == "cum_boe_12mo")
    assert clause.kind == "numeric"
    assert clause.op == "gte"
    assert clause.value == 250_000


def test_heuristic_relative_date_window():
    resp = _interpret_heuristic("permits filed in the last 6 months", None)
    clause = next(c for c in resp.filters if c.field == "permit_date")
    assert clause.kind == "date"
    assert clause.start is not None and clause.start == _months_ago_iso(6)


def test_heuristic_no_match_is_low_confidence():
    resp = _interpret_heuristic("show me something interesting", None)
    assert resp.confidence == 0.0
    assert resp.notes == "no_match"


def test_heuristic_word_boundary_avoids_substring_false_positive():
    # "producers" must not trip the DUC status (substring "duc").
    resp = _interpret_heuristic("permian producers", None)
    status = [c for c in resp.filters if c.field == "well_status"]
    assert status == []


def test_heuristic_generic_family_not_double_counted():
    # "cum boe 12mo over 250k" yields only cum_boe_12mo, not a spurious cum_boe_to_date.
    resp = _interpret_heuristic("cum boe 12mo over 250k", None)
    boe_fields = sorted(c.field for c in resp.filters if c.field.startswith("cum_boe"))
    assert boe_fields == ["cum_boe_12mo"]
    clause = next(c for c in resp.filters if c.field == "cum_boe_12mo")
    assert clause.value == 250_000


def test_heuristic_month_token_not_read_as_threshold():
    # The "12" in "12mo" is a duration, not a value.
    resp = _interpret_heuristic("cum boe over 12 months", None)
    for c in resp.filters:
        if c.kind == "numeric":
            assert c.value != 12


# ---------------------------------------------------------------------------
# Presets
# ---------------------------------------------------------------------------

def test_presets_require_basin(offline):
    resp = get_presets(None)
    assert resp.presets == []
    assert resp.requires_basin is True


def test_presets_resolved_with_counts_for_basin(offline):
    resp = get_presets("PERMIAN")
    assert len(resp.presets) == 4
    assert all(p.est_count is not None for p in resp.presets)
    assert all(p.basin == "PERMIAN" for p in resp.presets)


def test_field_stats_numeric_uses_catalog_domain(offline):
    resp = get_field_stats("lateral_length", "PERMIAN", [])
    assert resp.data_type == "numeric"
    assert resp.min == 0
    assert resp.max == 25000
    assert resp.source == "mock"


def test_field_stats_date_returns_iso_window(offline):
    resp = get_field_stats("spud_date", None, [])
    assert resp.data_type == "date"
    assert resp.min_date == "2008-01-01"
    assert resp.max_date is not None and len(resp.max_date) == 10


def test_field_stats_unknown_field_is_safe(offline):
    resp = get_field_stats("not_a_real_column", None, [])
    assert resp.source == "mock"
    assert resp.min is None and resp.min_date is None


def test_months_ago_iso_is_valid_date_string():
    value = _months_ago_iso(6)
    year, month, day = value.split("-")
    assert 2000 <= int(year) <= 2100
    assert 1 <= int(month) <= 12
    assert 1 <= int(day) <= 28
