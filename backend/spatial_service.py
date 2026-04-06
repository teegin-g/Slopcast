"""
Spatial service — Databricks SQL Warehouse connection + mock fallback.

Module-level API (consumed by spatial_routes.py):
    get_wells_in_bounds(bounds, filters, limit) -> SpatialWellsResponse
    get_available_layers() -> SpatialLayersResponse
    check_connection_status() -> dict

Legacy class (kept for backward compat with main.py lifespan):
    SpatialDBManager — PostGIS-oriented manager, still registered on app.state
"""

from __future__ import annotations

import logging
import os
import time
from decimal import Decimal
from typing import Any

from dotenv import load_dotenv

from .models import Well, WellStatus
from .spatial_models import (
    SpatialLayer,
    SpatialLayerFilter,
    SpatialLayersResponse,
    SpatialWellsResponse,
    ViewportBounds,
)

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level connection state (tests patch _db_connection directly)
# ---------------------------------------------------------------------------

_db_connection: Any | None = None
_cache: dict[str, SpatialWellsResponse] = {}

# ---------------------------------------------------------------------------
# Deterministic mock data — 40 Permian Basin wells
# All coordinates fall within lat [31.825, 31.975] lng [-102.4, -102.2],
# which is comfortably inside the test wide bounds 31.0–33.0 / -103.0–-101.0.
# ---------------------------------------------------------------------------

_OPERATORS = ["Strata Ops LLC", "Blue Mesa Energy", "Atlas Peak Resources"]
_FORMATIONS = ["Wolfcamp A", "Wolfcamp B", "Bone Spring"]
_STATUSES: list[WellStatus] = ["PRODUCING", "DUC", "PERMIT"]
_CENTER_LAT = 31.9
_CENTER_LNG = -102.3


def _build_mock_wells() -> list[Well]:
    """Generate deterministic mock wells using a simple LCG-based spread."""
    wells: list[Well] = []
    # Use a fixed sequence of offsets derived from a simple formula so results
    # are repeatable without importing random (which has global state).
    for i in range(40):
        # Spread evenly across the ±0.075 lat / ±0.1 lng window
        lat_offset = ((i * 7 + 3) % 30 - 15) * 0.005   # range ±0.075
        lng_offset = ((i * 11 + 5) % 40 - 20) * 0.005  # range ±0.1
        wells.append(
            Well(
                id=f"w-{i}",
                name=f"Maverick {i + 1}H",
                lat=_CENTER_LAT + lat_offset,
                lng=_CENTER_LNG + lng_offset,
                lateralLength=10000.0 if i % 2 == 0 else 7500.0,
                status=_STATUSES[i % 3],
                operator=_OPERATORS[i % 3],
                formation=_FORMATIONS[i % 3],
            )
        )
    return wells


_MOCK_WELLS: list[Well] = _build_mock_wells()

# ---------------------------------------------------------------------------
# Databricks connection helpers
# ---------------------------------------------------------------------------


def _get_db_connection() -> Any | None:
    """
    Return a live Databricks SQL connection, or None if credentials are absent
    or the connection attempt fails.  Caches on success in module-level state.
    """
    global _db_connection  # noqa: PLW0603

    if _db_connection is not None:
        return _db_connection

    hostname = os.getenv("DATABRICKS_SERVER_HOSTNAME")
    http_path = os.getenv("DATABRICKS_HTTP_PATH")
    token = os.getenv("DATABRICKS_TOKEN")

    if not (hostname and http_path and token):
        return None

    try:
        from databricks import sql as databricks_sql  # type: ignore[import-untyped]

        conn = databricks_sql.connect(
            server_hostname=hostname,
            http_path=http_path,
            access_token=token,
        )
        _db_connection = conn
        logger.info("Connected to Databricks SQL Warehouse.")
        return conn
    except Exception as exc:  # noqa: BLE001
        logger.warning("Databricks connection failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# NAD27 → WGS84 coordinate transform
# ---------------------------------------------------------------------------

_transformer: Any | None = None


def _get_transformer() -> Any | None:
    global _transformer  # noqa: PLW0603
    if _transformer is not None:
        return _transformer
    try:
        from pyproj import Transformer  # type: ignore[import-untyped]

        _transformer = Transformer.from_crs("EPSG:4267", "EPSG:4326", always_xy=True)
        return _transformer
    except Exception as exc:  # noqa: BLE001
        logger.warning("pyproj unavailable, skipping coordinate transform: %s", exc)
        return None


def _transform_coords(lat_nad27: float, lng_nad27: float) -> tuple[float, float]:
    """Convert NAD27 lat/lng to WGS84.  Returns original values if pyproj is absent."""
    t = _get_transformer()
    if t is None:
        return lat_nad27, lng_nad27
    # Transformer.transform(x=lng, y=lat) when always_xy=True
    lng_wgs84, lat_wgs84 = t.transform(lng_nad27, lat_nad27)
    return float(lat_wgs84), float(lng_wgs84)


# ---------------------------------------------------------------------------
# Status mapping
# ---------------------------------------------------------------------------

_STATUS_MAP: dict[str, WellStatus] = {
    "PRODUCING": "PRODUCING",
    "DUC": "DUC",
    "PERMIT": "PERMIT",
}


def _map_status(raw: str | None) -> WellStatus:
    if raw is None:
        return "PERMIT"
    return _STATUS_MAP.get(str(raw).upper(), "PERMIT")


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------


def _cache_key(bounds: ViewportBounds, filters: SpatialLayerFilter | None, limit: int) -> str:
    f_str = ""
    if filters:
        f_str = (
            f"{sorted(filters.statuses or [])}|"
            f"{sorted(filters.operators or [])}|"
            f"{sorted(filters.formations or [])}|"
            f"{sorted(filters.layers or [])}"
        )
    return f"{bounds.sw_lat},{bounds.sw_lng},{bounds.ne_lat},{bounds.ne_lng}|{f_str}|{limit}"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_wells_in_bounds(
    bounds: ViewportBounds,
    filters: SpatialLayerFilter | None = None,
    limit: int = 2000,
) -> SpatialWellsResponse:
    """
    Return wells within the given viewport bounds.

    Uses Databricks SQL Warehouse when credentials are available; falls back
    to deterministic mock data otherwise.
    """
    key = _cache_key(bounds, filters, limit)
    if key in _cache:
        return _cache[key]

    conn = _get_db_connection()
    if conn is not None:
        result = _query_databricks(conn, bounds, filters, limit)
    else:
        result = _query_mock(bounds, filters, limit)

    _cache[key] = result
    return result


def get_available_layers() -> SpatialLayersResponse:
    """Return the hardcoded list of available spatial layers."""
    return SpatialLayersResponse(
        layers=[
            SpatialLayer(
                id="producing",
                label="Producing Wells",
                description="Active producing wells",
                enabled_by_default=True,
            ),
            SpatialLayer(
                id="duc",
                label="DUC Wells",
                description="Drilled but uncompleted wells",
                enabled_by_default=True,
            ),
            SpatialLayer(
                id="permit",
                label="Permitted Wells",
                description="Permitted but not yet drilled wells",
                enabled_by_default=True,
            ),
            SpatialLayer(
                id="laterals",
                label="Lateral Traces",
                description="Horizontal wellbore lateral paths",
                enabled_by_default=False,
            ),
        ]
    )


def check_connection_status() -> dict[str, Any]:
    """Return connectivity status dict."""
    hostname = os.getenv("DATABRICKS_SERVER_HOSTNAME")
    if not hostname:
        return {"connected": False, "source": "mock", "error": None, "table": None}

    conn = _get_db_connection()
    if conn is not None:
        table = (
            f"{os.getenv('DATABRICKS_CATALOG', 'eds')}."
            f"{os.getenv('DATABRICKS_SCHEMA', 'well')}."
            f"{os.getenv('DATABRICKS_WELLS_TABLE', 'tbl_well_summary_all')}"
        )
        return {"connected": True, "source": "databricks", "error": None, "table": table}

    return {
        "connected": False,
        "source": "mock",
        "error": "Databricks connection unavailable",
        "table": None,
    }


# ---------------------------------------------------------------------------
# Query implementations
# ---------------------------------------------------------------------------


def _query_databricks(
    conn: Any,
    bounds: ViewportBounds,
    filters: SpatialLayerFilter | None,
    limit: int,
) -> SpatialWellsResponse:
    catalog = os.getenv("DATABRICKS_CATALOG", "eds")
    schema = os.getenv("DATABRICKS_SCHEMA", "well")
    table = os.getenv("DATABRICKS_WELLS_TABLE", "tbl_well_summary_all")
    full_table = f"{catalog}.{schema}.{table}"

    sql = f"""
        SELECT api_14, well_name,
               sh_latitude_nad27, sh_longitude_nad27,
               lateral_length, well_status, operator, formation
        FROM {full_table}
        WHERE sh_latitude_nad27 BETWEEN %(sw_lat)s AND %(ne_lat)s
          AND sh_longitude_nad27 BETWEEN %(sw_lng)s AND %(ne_lng)s
          AND sh_latitude_nad27 IS NOT NULL
        LIMIT %(limit)s
    """
    params = {
        "sw_lat": bounds.sw_lat,
        "ne_lat": bounds.ne_lat,
        "sw_lng": bounds.sw_lng,
        "ne_lng": bounds.ne_lng,
        "limit": limit,
    }

    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            cols = [d[0] for d in cursor.description]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Databricks query failed, falling back to mock: %s", exc)
        return _query_mock(bounds, filters, limit)

    wells: list[Well] = []
    for row in rows:
        row_dict = dict(zip(cols, row))
        raw_lat = row_dict.get("sh_latitude_nad27")
        raw_lng = row_dict.get("sh_longitude_nad27")
        if raw_lat is None or raw_lng is None:
            continue
        lat, lng = _transform_coords(float(raw_lat), float(raw_lng))

        raw_ll = row_dict.get("lateral_length")
        lateral_length = float(raw_ll) if raw_ll is not None else 0.0
        if isinstance(raw_ll, Decimal):
            lateral_length = float(raw_ll)

        well = Well(
            id=str(row_dict.get("api_14", "")),
            name=str(row_dict.get("well_name", "")),
            lat=lat,
            lng=lng,
            lateralLength=lateral_length,
            status=_map_status(row_dict.get("well_status")),
            operator=str(row_dict.get("operator", "")),
            formation=str(row_dict.get("formation", "")),
        )

        # Apply client-side filters (status / operator / formation)
        if filters and not _passes_filter(well, filters):
            continue
        wells.append(well)

    total = len(wells)
    truncated = total >= limit
    return SpatialWellsResponse(
        wells=wells,
        total_count=total,
        truncated=truncated,
        source="databricks",
    )


def _query_mock(
    bounds: ViewportBounds,
    filters: SpatialLayerFilter | None,
    limit: int,
) -> SpatialWellsResponse:
    candidates = [
        w
        for w in _MOCK_WELLS
        if bounds.sw_lat <= w.lat <= bounds.ne_lat
        and bounds.sw_lng <= w.lng <= bounds.ne_lng
    ]
    if filters:
        candidates = [w for w in candidates if _passes_filter(w, filters)]

    truncated = len(candidates) > limit
    wells = candidates[:limit]
    return SpatialWellsResponse(
        wells=wells,
        total_count=len(wells),
        truncated=truncated,
        source="mock",
    )


def _passes_filter(well: Well, filters: SpatialLayerFilter) -> bool:
    if filters.statuses and well.status not in filters.statuses:
        return False
    if filters.operators and well.operator not in filters.operators:
        return False
    if filters.formations and well.formation not in filters.formations:
        return False
    return True


# ---------------------------------------------------------------------------
# Legacy PostGIS manager (kept for main.py lifespan backward compat)
# ---------------------------------------------------------------------------

_CONNECT_RETRY_INTERVAL_SECS = 30.0
_CONNECTION_TIMEOUT_SECS = 5.0


class SpatialDBManager:
    """
    Manages a lazily-initialized connection to the optional PostGIS database.

    Still registered on app.state for backward compat with main.py lifespan.
    The active spatial data source is now the module-level Databricks functions.
    """

    def __init__(self, dsn: str | None = None) -> None:
        self._dsn: str | None = dsn if dsn is not None else os.getenv("SPATIAL_DB_DSN")
        self._conn: Any | None = None
        self._last_attempt: float = 0.0
        self._last_error: str | None = None

    def connection(self) -> Any | None:
        if self._dsn is None:
            return None
        if self._conn is not None:
            return self._conn
        now = time.monotonic()
        if now - self._last_attempt < _CONNECT_RETRY_INTERVAL_SECS:
            return None
        return self._attempt_connect()

    def disconnect(self) -> None:
        if self._conn is not None:
            try:
                self._conn.close()
            except Exception as exc:  # noqa: BLE001
                logger.warning("Error closing spatial DB connection: %s", exc)
            finally:
                self._conn = None

    def health(self) -> dict[str, object]:
        return {
            "connected": self._conn is not None,
            "error": self._last_error,
            "dsn_configured": self._dsn is not None,
        }

    def _attempt_connect(self) -> Any | None:
        self._last_attempt = time.monotonic()
        try:
            conn = self._open_connection()
            self._conn = conn
            self._last_error = None
            logger.info("Spatial DB connected successfully.")
            return conn
        except Exception as exc:  # noqa: BLE001
            self._last_error = str(exc)
            logger.warning("Spatial DB connection failed: %s", exc)
            return None

    def _open_connection(self) -> Any:
        assert self._dsn is not None
        try:
            import psycopg2  # type: ignore[import-untyped]

            return psycopg2.connect(self._dsn, connect_timeout=int(_CONNECTION_TIMEOUT_SECS))
        except ImportError:
            pass
        import sqlite3

        return sqlite3.connect(self._dsn, timeout=_CONNECTION_TIMEOUT_SECS)


def get_spatial_db(request: Any) -> "SpatialDBManager":  # noqa: F821
    """FastAPI dependency that returns the app-lifetime SpatialDBManager."""
    return request.app.state.spatial_db
