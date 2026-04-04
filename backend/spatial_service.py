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
_last_db_attempt: float = 0
_last_db_error: str | None = None
_DB_RETRY_INTERVAL = 60.0


def _get_db_connection():
    global _db_connection, _last_db_attempt, _last_db_error

    # If we have a cached connection, test it with a lightweight query
    if _db_connection is not None:
        try:
            cursor = _db_connection.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            return _db_connection
        except Exception as exc:
            logger.warning("Existing Databricks connection stale: %s", exc)
            _db_connection = None

    # Retry throttle: don't hammer a failing connection
    now = time.time()
    if _last_db_error is not None and (now - _last_db_attempt) < _DB_RETRY_INTERVAL:
        return None

    hostname = os.environ.get("DATABRICKS_SERVER_HOSTNAME")
    http_path = os.environ.get("DATABRICKS_HTTP_PATH")
    token = os.environ.get("DATABRICKS_TOKEN")

    if not all([hostname, http_path, token]):
        return None

    _last_db_attempt = now
    try:
        from databricks.sql import connect

        _db_connection = connect(
            server_hostname=hostname,
            http_path=http_path,
            access_token=token,
        )
        _last_db_error = None
        return _db_connection
    except Exception as exc:
        logger.warning("Failed to connect to Databricks: %s", exc)
        _last_db_error = str(exc)
        return None


def check_connection_status() -> dict:
    """Return connection health info for the status endpoint."""
    catalog = os.environ.get("DATABRICKS_CATALOG", "eds")
    schema = os.environ.get("DATABRICKS_SCHEMA", "well")
    table = os.environ.get("DATABRICKS_WELLS_TABLE", "tbl_well_summary_all")
    full_table = f"{catalog}.{schema}.{table}"

    conn = _get_db_connection()
    if conn is not None:
        return {
            "connected": True,
            "source": "databricks",
            "error": None,
            "table": full_table,
        }

    # No live connection — report why
    hostname = os.environ.get("DATABRICKS_SERVER_HOSTNAME")
    token = os.environ.get("DATABRICKS_TOKEN")
    if not hostname or not token:
        return {
            "connected": False,
            "source": "mock",
            "error": "Databricks credentials not configured",
            "table": None,
        }

    return {
        "connected": False,
        "source": "mock",
        "error": _last_db_error or "Connection unavailable",
        "table": full_table,
    }


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


def _map_well_status(raw: str) -> str:
    """Map Databricks well_status values to our Well status enum."""
    upper = raw.upper().strip()
    if "PRODUC" in upper or "ACTIVE" in upper:
        return "PRODUCING"
    if "DUC" in upper or "DRILLED" in upper or "UNCOMPLETE" in upper:
        return "DUC"
    if "PERMIT" in upper or "APPROVED" in upper:
        return "PERMIT"
    return "PRODUCING"  # safe default
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
        f"SELECT api_14, well_name, sh_latitude_nad27, sh_longitude_nad27, "
        f"lateral_length, well_status, operator, formation "
        f"FROM {catalog}.{schema}.{table} "
        f"WHERE sh_latitude_nad27 BETWEEN ? AND ? "
        f"AND sh_longitude_nad27 BETWEEN ? AND ? "
        f"AND sh_latitude_nad27 IS NOT NULL "
        f"AND sh_longitude_nad27 IS NOT NULL"
    )
    params: list = [bounds.sw_lat, bounds.ne_lat, bounds.sw_lng, bounds.ne_lng]

    if filters:
        if filters.statuses:
            placeholders = ", ".join("?" for _ in filters.statuses)
            query += f" AND well_status IN ({placeholders})"
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
                id=str(r[0]) if r[0] else f"db-{i}",
                name=str(r[1]) if r[1] else "",
                lat=float(r[2]),
                lng=float(r[3]),
                lateralLength=float(r[4]) if r[4] else 0.0,
                status=_map_well_status(str(r[5]) if r[5] else ""),
                operator=str(r[6]) if r[6] else "",
                formation=str(r[7]) if r[7] else "",
            )
            for i, r in enumerate(result_rows)
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
