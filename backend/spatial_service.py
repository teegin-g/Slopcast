from __future__ import annotations

import hashlib
import json
import logging
import os
import random
import time

from .models import Well
from .spatial_models import (
    SpatialLayer,
    SpatialLayerFilter,
    SpatialLayersResponse,
    SpatialWellsResponse,
    ViewportBounds,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Databricks connection (lazy)
# ---------------------------------------------------------------------------

_db_connection = None


def _get_db_connection():
    global _db_connection
    if _db_connection is not None:
        return _db_connection

    hostname = os.environ.get("DATABRICKS_SERVER_HOSTNAME")
    http_path = os.environ.get("DATABRICKS_HTTP_PATH")
    token = os.environ.get("DATABRICKS_TOKEN")

    if not all([hostname, http_path, token]):
        return None

    try:
        from databricks.sql import connect

        _db_connection = connect(
            server_hostname=hostname,
            http_path=http_path,
            access_token=token,
        )
        return _db_connection
    except Exception as exc:
        logger.warning("Failed to connect to Databricks: %s", exc)
        return None


# ---------------------------------------------------------------------------
# TTL cache (30 seconds)
# ---------------------------------------------------------------------------

_cache: dict[str, tuple[float, SpatialWellsResponse]] = {}
_CACHE_TTL = 30.0


def _cache_key(bounds: ViewportBounds, filters: SpatialLayerFilter | None, limit: int) -> str:
    key_data = {
        "sw_lat": round(bounds.sw_lat, 3),
        "sw_lng": round(bounds.sw_lng, 3),
        "ne_lat": round(bounds.ne_lat, 3),
        "ne_lng": round(bounds.ne_lng, 3),
        "filters": filters.model_dump() if filters else None,
        "limit": limit,
    }
    raw = json.dumps(key_data, sort_keys=True)
    return hashlib.md5(raw.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Mock data (matches MOCK_WELLS in src/constants.ts)
# ---------------------------------------------------------------------------

_STATUSES = ["PRODUCING", "DUC", "PERMIT"]
_OPERATORS = ["Strata Ops LLC", "Blue Mesa Energy", "Atlas Peak Resources"]
_FORMATIONS = ["Wolfcamp A", "Wolfcamp B", "Bone Spring"]


def _generate_mock_wells() -> list[Well]:
    rng = random.Random(42)
    wells: list[Well] = []
    for i in range(40):
        wells.append(
            Well(
                id=f"w-{i}",
                name=f"Maverick {i + 1}H",
                lat=31.9 + (rng.random() - 0.5) * 0.15,
                lng=-102.3 + (rng.random() - 0.5) * 0.2,
                lateralLength=10000.0 if i % 2 == 0 else 7500.0,
                status=_STATUSES[i % 3],
                operator=_OPERATORS[i % 3],
                formation=_FORMATIONS[i % 3],
            )
        )
    return wells


_MOCK_WELLS: list[Well] | None = None


def _get_mock_wells() -> list[Well]:
    global _MOCK_WELLS
    if _MOCK_WELLS is None:
        _MOCK_WELLS = _generate_mock_wells()
    return _MOCK_WELLS


# ---------------------------------------------------------------------------
# Available layers
# ---------------------------------------------------------------------------

_AVAILABLE_LAYERS = [
    SpatialLayer(
        id="producing",
        label="Producing",
        description="Active producing wells",
        enabled_by_default=True,
    ),
    SpatialLayer(
        id="duc",
        label="DUCs",
        description="Drilled but uncompleted wells",
        enabled_by_default=True,
    ),
    SpatialLayer(
        id="permit",
        label="Permits",
        description="Permitted well locations",
        enabled_by_default=True,
    ),
    SpatialLayer(
        id="laterals",
        label="Laterals",
        description="Horizontal lateral paths",
        enabled_by_default=False,
    ),
]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_wells_in_bounds(
    bounds: ViewportBounds,
    filters: SpatialLayerFilter | None = None,
    limit: int = 2000,
) -> SpatialWellsResponse:
    # Check cache first
    key = _cache_key(bounds, filters, limit)
    now = time.time()
    if key in _cache:
        cached_time, cached_response = _cache[key]
        if now - cached_time < _CACHE_TTL:
            return cached_response

    response = _query_databricks(bounds, filters, limit)
    if response is None:
        response = _query_mock(bounds, filters, limit)

    _cache[key] = (now, response)
    return response


def get_available_layers() -> SpatialLayersResponse:
    return SpatialLayersResponse(layers=_AVAILABLE_LAYERS)


# ---------------------------------------------------------------------------
# Databricks query
# ---------------------------------------------------------------------------


def _query_databricks(
    bounds: ViewportBounds,
    filters: SpatialLayerFilter | None,
    limit: int,
) -> SpatialWellsResponse | None:
    conn = _get_db_connection()
    if conn is None:
        return None

    catalog = os.environ.get("DATABRICKS_CATALOG", "eds")
    schema = os.environ.get("DATABRICKS_SCHEMA", "well")
    table = os.environ.get("DATABRICKS_WELLS_TABLE", "tbl_well_summary_all")

    query = (
        f"SELECT id, name, lat, lng, lateral_length AS lateralLength, "
        f"status, operator, formation "
        f"FROM {catalog}.{schema}.{table} "
        f"WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?"
    )
    params: list = [bounds.sw_lat, bounds.ne_lat, bounds.sw_lng, bounds.ne_lng]

    if filters:
        if filters.statuses:
            placeholders = ", ".join("?" for _ in filters.statuses)
            query += f" AND status IN ({placeholders})"
            params.extend(filters.statuses)
        if filters.operators:
            placeholders = ", ".join("?" for _ in filters.operators)
            query += f" AND operator IN ({placeholders})"
            params.extend(filters.operators)
        if filters.formations:
            placeholders = ", ".join("?" for _ in filters.formations)
            query += f" AND formation IN ({placeholders})"
            params.extend(filters.formations)

    query += f" LIMIT {limit + 1}"

    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        cursor.close()

        truncated = len(rows) > limit
        result_rows = rows[:limit]

        wells = [
            Well(
                id=str(r[0]),
                name=str(r[1]),
                lat=float(r[2]),
                lng=float(r[3]),
                lateralLength=float(r[4]),
                status=str(r[5]),
                operator=str(r[6]),
                formation=str(r[7]) if r[7] else "",
            )
            for r in result_rows
        ]

        return SpatialWellsResponse(
            wells=wells,
            total_count=len(wells),
            truncated=truncated,
            source="databricks",
        )
    except Exception as exc:
        logger.warning("Databricks query failed, falling back to mock: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Mock query
# ---------------------------------------------------------------------------


def _query_mock(
    bounds: ViewportBounds,
    filters: SpatialLayerFilter | None,
    limit: int,
) -> SpatialWellsResponse:
    all_wells = _get_mock_wells()

    filtered = [
        w
        for w in all_wells
        if bounds.sw_lat <= w.lat <= bounds.ne_lat
        and bounds.sw_lng <= w.lng <= bounds.ne_lng
    ]

    if filters:
        if filters.statuses:
            filtered = [w for w in filtered if w.status in filters.statuses]
        if filters.operators:
            filtered = [w for w in filtered if w.operator in filters.operators]
        if filters.formations:
            filtered = [w for w in filtered if w.formation in filters.formations]

    truncated = len(filtered) > limit
    result = filtered[:limit]

    return SpatialWellsResponse(
        wells=result,
        total_count=len(result),
        truncated=truncated,
        source="mock",
    )
