import os

import pytest

from backend.spatial_models import SpatialLayerFilter, ViewportBounds
from backend.spatial_service import (
    _build_in_clause,
    _cache,
    _query_databricks,
    _validate_identifier,
    _validate_table_path,
)


class CapturingCursor:
    description = [
        ("api_14",),
        ("well_name",),
        ("sh_latitude_nad27",),
        ("sh_longitude_nad27",),
        ("bh_latitude_nad27",),
        ("bh_longitude_nad27",),
        ("lateral_length",),
        ("well_status",),
        ("operator",),
        ("formation",),
    ]

    def __init__(self) -> None:
        self.sql = ""
        self.params = {}

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return None

    def execute(self, sql, params=None):
        self.sql = sql
        self.params = params or {}

    def fetchall(self):
        return [
            (
                "api-1",
                "A 1H",
                31.9,
                -102.3,
                31.91,
                -102.31,
                9500,
                "PRODUCING",
                "O'Reilly Energy'); DROP TABLE wells; --",
                "Wolfcamp A",
            )
        ]


class CapturingConnection:
    def __init__(self) -> None:
        self.cursor_instance = CapturingCursor()

    def cursor(self):
        return self.cursor_instance


def setup_function():
    _cache.clear()
    for key in ("DATABRICKS_CATALOG", "DATABRICKS_SCHEMA", "DATABRICKS_WELLS_TABLE"):
        os.environ.pop(key, None)


def test_databricks_identifiers_are_strictly_allowlisted():
    assert _validate_identifier("gis__well_master", label="table") == "gis__well_master"
    assert _validate_table_path("epw.egis.gis__well_master", label="table") == "epw.egis.gis__well_master"

    with pytest.raises(ValueError):
        _validate_identifier("gis__well_master; DROP TABLE x", label="table")
    with pytest.raises(ValueError):
        _validate_table_path("epw.egis.gis__well_master;DROP", label="table")


def test_in_clause_uses_bound_params_for_malicious_filter_values():
    params = {}
    clause = _build_in_clause("operator", ["O'Reilly Energy'); DROP TABLE wells; --"], "operator", params)

    assert "DROP TABLE" not in clause
    assert "%(operator_0)s" in clause
    assert params == {"operator_0": "O'Reilly Energy'); DROP TABLE wells; --"}


def test_wells_query_passes_filters_as_params_not_sql_literals():
    conn = CapturingConnection()
    malicious_operator = "O'Reilly Energy'); DROP TABLE wells; --"
    bounds = ViewportBounds(sw_lat=31.0, sw_lng=-103.0, ne_lat=33.0, ne_lng=-101.0)

    _query_databricks(
        conn,
        bounds,
        SpatialLayerFilter(operators=[malicious_operator], formations=["Wolfcamp A"]),
        10,
        detail_level="summary",
    )

    sql = conn.cursor_instance.sql
    params = conn.cursor_instance.params
    assert malicious_operator not in sql
    assert "operator IN (%(operator_0)s)" in sql
    assert "formation IN (%(formation_0)s)" in sql
    assert params["operator_0"] == malicious_operator
    assert params["formation_0"] == "Wolfcamp A"


def test_invalid_table_configuration_falls_back_to_mock(monkeypatch):
    monkeypatch.setenv("DATABRICKS_WELLS_TABLE", "gis__well_master; DROP TABLE x")
    bounds = ViewportBounds(sw_lat=31.0, sw_lng=-103.0, ne_lat=33.0, ne_lng=-101.0)

    result = _query_databricks(CapturingConnection(), bounds, None, 5, detail_level="points")

    assert result.source == "mock"
    assert result.total_count == 5
