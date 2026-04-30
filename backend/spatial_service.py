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
import math
import os
import re
import time
from decimal import Decimal
from typing import Any, Literal

from dotenv import load_dotenv

from .models import Well, WellStatus, WellTrajectory, WellTrajectoryPoint
from .spatial_models import (
    DetailLevel,
    SpatialLayer,
    SpatialLayerFilter,
    SpatialLayersResponse,
    SpatialWellsResponse,
    ViewportBounds,
)

_BACKEND_DIR = os.path.dirname(__file__)
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
load_dotenv(os.path.join(_BACKEND_DIR, ".env"))
load_dotenv(os.path.join(_PROJECT_ROOT, ".env.local"), override=True)
load_dotenv(os.path.join(_PROJECT_ROOT, ".env.backend.local"), override=True)

logger = logging.getLogger(__name__)

_DEFAULT_DATABRICKS_CATALOG = "epw"
_DEFAULT_DATABRICKS_SCHEMA = "egis"
_DEFAULT_DATABRICKS_WELLS_TABLE = "gis__well_master"
_DEFAULT_DATABRICKS_TRAJECTORY_TABLE = "epw.egis.gis__well_master"
_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _validate_identifier(value: str, *, label: str) -> str:
    if not _IDENTIFIER_RE.fullmatch(value):
        raise ValueError(f"Invalid Databricks {label} identifier: {value!r}")
    return value


def _validate_table_path(value: str, *, label: str) -> str:
    parts = value.split(".")
    if not 1 <= len(parts) <= 3:
        raise ValueError(f"Invalid Databricks {label} table path: {value!r}")
    return ".".join(_validate_identifier(part, label=label) for part in parts)


def _databricks_table_path() -> str:
    catalog = _validate_identifier(
        os.getenv("DATABRICKS_CATALOG", _DEFAULT_DATABRICKS_CATALOG),
        label="catalog",
    )
    schema = _validate_identifier(
        os.getenv("DATABRICKS_SCHEMA", _DEFAULT_DATABRICKS_SCHEMA),
        label="schema",
    )
    table = _validate_identifier(
        os.getenv("DATABRICKS_WELLS_TABLE", _DEFAULT_DATABRICKS_WELLS_TABLE),
        label="wells table",
    )
    return f"{catalog}.{schema}.{table}"


def _trajectory_table_path() -> str:
    return _validate_table_path(
        os.getenv("DATABRICKS_TRAJECTORY_TABLE", _DEFAULT_DATABRICKS_TRAJECTORY_TABLE),
        label="trajectory",
    )


def _build_in_clause(column: str, values: list[str] | None, prefix: str, params: dict[str, Any]) -> str:
    if not values:
        return ""
    placeholders: list[str] = []
    for index, value in enumerate(values):
        key = f"{prefix}_{index}"
        params[key] = value
        placeholders.append(f"%({key})s")
    return f"  AND {column} IN ({', '.join(placeholders)})\n"


def _resolve_server_hostname() -> str | None:
    raw = (
        os.getenv("DATABRICKS_SERVER_HOSTNAME")
        or os.getenv("DATABRICKS_HOST")
        or os.getenv("DATABRICKS_WORKSPACE_URL")
    )
    if not raw:
        return None
    return raw.replace("https://", "").replace("http://", "").rstrip("/")


def _resolve_http_path() -> str | None:
    http_path = os.getenv("DATABRICKS_HTTP_PATH")
    if http_path:
        return http_path
    warehouse_id = os.getenv("DATABRICKS_WAREHOUSE_ID")
    if warehouse_id:
        return f"/sql/1.0/warehouses/{warehouse_id}"
    return None


def _resolve_access_token() -> str | None:
    return os.getenv("DATABRICKS_TOKEN") or os.getenv("DATABRICKS_ACCESS_TOKEN")

# ---------------------------------------------------------------------------
# Connection manager — replaces bare module-level _db_connection singleton
# ---------------------------------------------------------------------------

ConnectionStatus = Literal["connected", "disconnected", "connecting"]


class ConnectionManager:
    """
    Manages a Databricks SQL Warehouse connection with health checks,
    auto-reconnect (max 2 attempts), and per-operation query timeouts.

    Query timeout guidance (passed to cursor operations):
      - Wells query: 30s
      - Trajectory query: 15s
      - Health ping: 5s
    """

    _MAX_RECONNECT_ATTEMPTS = 2
    _CONNECT_TIMEOUT = 15  # seconds for databricks_sql.connect()
    _PING_INTERVAL = 60  # seconds between health pings
    _PING_TIMEOUT = 5  # seconds for the SELECT 1 health check

    def __init__(self) -> None:
        self.connection: Any | None = None
        self.status: ConnectionStatus = "disconnected"
        self.last_verified_at: float = 0.0
        self.reconnect_attempts: int = 0
        self.error: str | None = None

    def get_connection(self) -> Any | None:
        """
        Return a live connection, reconnecting if necessary.

        Performs a health ping if the last verification was >60s ago.
        Returns None if no credentials or all reconnect attempts fail.
        """
        if self.connection is None or self.status == "disconnected":
            if not self._reconnect():
                return None

        # Periodic health check
        if time.time() - self.last_verified_at > self._PING_INTERVAL:
            if not self._ping():
                if not self._reconnect():
                    return None

        return self.connection

    def _reconnect(self) -> bool:
        """Attempt to establish a new connection (max 2 attempts)."""
        hostname = _resolve_server_hostname()
        http_path = _resolve_http_path()
        token = _resolve_access_token()

        if not (hostname and http_path and token):
            self.status = "disconnected"
            self.error = "Databricks credentials not configured"
            return False

        self._close_existing()
        self.status = "connecting"

        for attempt in range(1, self._MAX_RECONNECT_ATTEMPTS + 1):
            try:
                from databricks import sql as databricks_sql  # type: ignore[import-untyped]

                conn = databricks_sql.connect(
                    server_hostname=hostname,
                    http_path=http_path,
                    access_token=token,
                    _socket_timeout=self._CONNECT_TIMEOUT,
                )
                self.connection = conn
                self.status = "connected"
                self.last_verified_at = time.time()
                self.reconnect_attempts = 0
                self.error = None
                logger.info("Connected to Databricks SQL Warehouse (attempt %d).", attempt)
                return True
            except Exception as exc:  # noqa: BLE001
                self.reconnect_attempts += 1
                self.error = str(exc)
                logger.warning(
                    "Databricks connection attempt %d/%d failed: %s",
                    attempt,
                    self._MAX_RECONNECT_ATTEMPTS,
                    exc,
                )

        self.status = "disconnected"
        return False

    def _ping(self) -> bool:
        """Run a lightweight SELECT 1 to verify the connection is alive."""
        if self.connection is None:
            return False
        try:
            with self.connection.cursor() as cursor:
                # The installed databricks-sql-connector does not accept a
                # per-query timeout kwarg on cursor.execute(). Connection-level
                # socket timeouts still protect us from hanging forever.
                cursor.execute("SELECT 1")
                cursor.fetchone()
            self.last_verified_at = time.time()
            return True
        except Exception as exc:  # noqa: BLE001
            logger.warning("Databricks health ping failed: %s", exc)
            self.error = str(exc)
            self.status = "disconnected"
            self.connection = None
            return False

    def _close_existing(self) -> None:
        """Safely close the current connection if any."""
        if self.connection is not None:
            try:
                self.connection.close()
            except Exception:  # noqa: BLE001
                pass
            self.connection = None


# Module-level singleton — tests can patch _conn_mgr or its attributes
_conn_mgr = ConnectionManager()

# Backward-compat alias: tests that patched _db_connection directly can
# now patch _conn_mgr.connection instead.  The old _get_db_connection()
# delegates to the manager.
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
    Return a live Databricks SQL connection, or None if unavailable.
    Delegates to the ConnectionManager singleton.
    """
    return _conn_mgr.get_connection()


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

def _map_status(raw: str | None) -> WellStatus | None:
    if raw is None:
        return None
    value = str(raw).upper().strip()
    if value == "PRODUCING":
        return "PRODUCING"
    if value == "DUC" or "WAITING ON COMPLETION" in value:
        return "DUC"
    if value == "PERMIT" or value.startswith("PERMIT ") or value in {"PRE-DRILL", "NOT DRILLED"}:
        return "PERMIT"
    return None


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------


def _cache_key(
    bounds: ViewportBounds,
    filters: SpatialLayerFilter | None,
    limit: int,
    detail_level: DetailLevel,
    zoom: int | None = None,
) -> str:
    f_str = ""
    if filters:
        f_str = (
            f"{sorted(filters.statuses or [])}|"
            f"{sorted(filters.operators or [])}|"
            f"{sorted(filters.formations or [])}|"
            f"{sorted(filters.layers or [])}"
        )
    zoom_part = ""
    if detail_level == "full":
        zoom_part = f"|zoom={zoom if zoom is not None else 'none'}"
    return (
        f"{bounds.sw_lat},{bounds.sw_lng},{bounds.ne_lat},{bounds.ne_lng}"
        f"|{f_str}|{limit}|detail={detail_level}{zoom_part}"
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_wells_in_bounds(
    bounds: ViewportBounds,
    filters: SpatialLayerFilter | None = None,
    limit: int = 2000,
    include_trajectory: bool = False,
    detail_level: DetailLevel = "summary",
    zoom: int | None = None,
) -> SpatialWellsResponse:
    """
    Return wells within the given viewport bounds.

    Uses Databricks SQL Warehouse when credentials are available; falls back
    to deterministic mock data otherwise.

    detail_level controls query verbosity:
      - "points": id, lat, lng, status only (~90% less data, for cluster rendering)
      - "summary": all well fields except trajectory (default)
      - "full": summary + directional survey trajectory

    include_trajectory=True is kept for backward compat and implies detail_level="full".
    """
    # Backward compat: include_trajectory=True implies full
    if include_trajectory and detail_level != "full":
        detail_level = "full"

    key = _cache_key(bounds, filters, limit, detail_level, zoom=zoom)
    if key in _cache:
        return _cache[key]

    has_live_credentials = bool(
        _resolve_server_hostname()
        and _resolve_http_path()
        and _resolve_access_token()
    )
    conn = _get_db_connection()
    if conn is not None:
        result = _query_databricks(conn, bounds, filters, limit, detail_level, zoom=zoom)
    else:
        result = _query_mock(bounds, filters, limit, detail_level)

    # When live credentials are configured, avoid caching mock fallback results.
    # A transient Databricks outage would otherwise poison this viewport key and
    # keep serving stale demo data after the warehouse recovers.
    if result.source == "databricks" or not has_live_credentials:
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
    """Return connectivity status dict with health metadata."""
    hostname = _resolve_server_hostname()
    if not hostname:
        return {
            "connected": False,
            "source": "mock",
            "error": None,
            "table": None,
            "last_verified_at": None,
            "reconnect_attempts": 0,
        }

    conn = _get_db_connection()
    if conn is not None:
        try:
            table = _databricks_table_path()
        except ValueError as exc:
            return {
                "connected": False,
                "source": "mock",
                "error": str(exc),
                "table": None,
                "last_verified_at": _conn_mgr.last_verified_at or None,
                "reconnect_attempts": _conn_mgr.reconnect_attempts,
            }
        return {
            "connected": True,
            "source": "databricks",
            "error": None,
            "table": table,
            "last_verified_at": _conn_mgr.last_verified_at or None,
            "reconnect_attempts": _conn_mgr.reconnect_attempts,
        }

    return {
        "connected": False,
        "source": "mock",
        "error": _conn_mgr.error or "Databricks connection unavailable",
        "table": None,
        "last_verified_at": _conn_mgr.last_verified_at or None,
        "reconnect_attempts": _conn_mgr.reconnect_attempts,
    }


# ---------------------------------------------------------------------------
# Query implementations
# ---------------------------------------------------------------------------


def _query_databricks(
    conn: Any,
    bounds: ViewportBounds,
    filters: SpatialLayerFilter | None,
    limit: int,
    detail_level: DetailLevel = "summary",
    zoom: int | None = None,
) -> SpatialWellsResponse:
    try:
        full_table = _databricks_table_path()
    except ValueError as exc:
        logger.warning("Invalid Databricks table configuration, falling back to mock: %s", exc)
        return _query_mock(bounds, filters, limit, detail_level)

    params = {
        "sw_lat": bounds.sw_lat,
        "ne_lat": bounds.ne_lat,
        "sw_lng": bounds.sw_lng,
        "ne_lng": bounds.ne_lng,
        "limit": limit,
    }

    extra_where = ""
    if filters:
        extra_where += _build_in_clause("operator", filters.operators, "operator", params)
        extra_where += _build_in_clause("formation", filters.formations, "formation", params)

    if detail_level == "points":
        sql = f"""
            SELECT api_14, sh_latitude_nad27, sh_longitude_nad27, well_status
            FROM {full_table}
            WHERE sh_latitude_nad27 BETWEEN %(sw_lat)s AND %(ne_lat)s
              AND sh_longitude_nad27 BETWEEN %(sw_lng)s AND %(ne_lng)s
              AND sh_latitude_nad27 IS NOT NULL
{extra_where}            LIMIT %(limit)s
        """
    else:
        sql = f"""
            SELECT api_14, well_name,
                   sh_latitude_nad27, sh_longitude_nad27,
                   bh_latitude_nad27, bh_longitude_nad27,
                   lateral_length, well_status, operator, formation
            FROM {full_table}
            WHERE sh_latitude_nad27 BETWEEN %(sw_lat)s AND %(ne_lat)s
              AND sh_longitude_nad27 BETWEEN %(sw_lng)s AND %(ne_lng)s
              AND sh_latitude_nad27 IS NOT NULL
{extra_where}            LIMIT %(limit)s
        """

    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            cols = [d[0] for d in cursor.description]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Databricks query failed, falling back to mock: %s", exc)
        return _query_mock(bounds, filters, limit, detail_level)

    if detail_level == "points":
        wells: list[Well] = []
        for row in rows:
            row_dict = dict(zip(cols, row))
            raw_lat = row_dict.get("sh_latitude_nad27")
            raw_lng = row_dict.get("sh_longitude_nad27")
            if raw_lat is None or raw_lng is None:
                continue
            status = _map_status(row_dict.get("well_status"))
            if status is None:
                continue
            lat, lng = _transform_coords(float(raw_lat), float(raw_lng))
            well = Well(
                id=str(row_dict.get("api_14", "")),
                name="",
                lat=lat,
                lng=lng,
                lateralLength=0,
                status=status,
                operator="",
                formation="",
            )
            if filters and not _passes_filter(well, filters):
                continue
            wells.append(well)

        total = len(wells)
        return SpatialWellsResponse(
            wells=wells,
            total_count=total,
            truncated=total >= limit,
            source="databricks",
        )

    # summary or full: build intermediate well data including raw BH coords for trajectory
    well_data: list[tuple[Well, float, float, float, float]] = []  # (well, sh_lat_wgs84, sh_lng_wgs84, bh_lat_wgs84, bh_lng_wgs84)
    for row in rows:
        row_dict = dict(zip(cols, row))
        raw_lat = row_dict.get("sh_latitude_nad27")
        raw_lng = row_dict.get("sh_longitude_nad27")
        if raw_lat is None or raw_lng is None:
            continue
        sh_lat_nad27 = float(raw_lat)
        sh_lng_nad27 = float(raw_lng)
        lat, lng = _transform_coords(sh_lat_nad27, sh_lng_nad27)
        status = _map_status(row_dict.get("well_status"))
        if status is None:
            continue

        raw_bh_lat = row_dict.get("bh_latitude_nad27")
        raw_bh_lng = row_dict.get("bh_longitude_nad27")
        bh_lat_wgs84, bh_lng_wgs84 = _transform_coords(
            float(raw_bh_lat) if raw_bh_lat is not None else sh_lat_nad27,
            float(raw_bh_lng) if raw_bh_lng is not None else sh_lng_nad27,
        )

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
            status=status,
            operator=str(row_dict.get("operator", "")),
            formation=str(row_dict.get("formation", "")),
        )

        if filters and not _passes_filter(well, filters):
            continue
        well_data.append((well, lat, lng, bh_lat_wgs84, bh_lng_wgs84))

    result_wells = [wd[0] for wd in well_data]

    if detail_level == "full" and result_wells:
        api_ids = [w.id for w in result_wells]
        trajectories = _fetch_trajectories(conn, api_ids, well_data, zoom=zoom)
        for well in result_wells:
            well.trajectory = trajectories.get(well.id)

    total = len(result_wells)
    return SpatialWellsResponse(
        wells=result_wells,
        total_count=total,
        truncated=total >= limit,
        source="databricks",
    )


_MAX_STATIONS_PER_WELL = 50  # default when zoom is not provided


def _max_stations_for_zoom(zoom: int | None) -> int:
    """Return max trajectory stations per well based on map zoom level."""
    if zoom is None:
        return _MAX_STATIONS_PER_WELL
    if zoom <= 13:
        return 20
    if zoom <= 15:
        return 35
    return 50


def _subsample(items: list[Any], max_count: int) -> list[Any]:
    """Subsample a list to at most *max_count* evenly-spaced items, always keeping first and last."""
    n = len(items)
    if n <= max_count:
        return items
    # Always include first and last; pick evenly-spaced indices in between
    step = (n - 1) / (max_count - 1)
    indices = [round(i * step) for i in range(max_count)]
    return [items[i] for i in indices]


def _fetch_trajectories(
    conn: Any,
    api_ids: list[str],
    well_data: list[tuple[Well, float, float, float, float]],
    zoom: int | None = None,
) -> dict[str, WellTrajectory]:
    """
    Fetch the FULL directional survey for each well in *api_ids* and return
    a mapping of api_14 -> WellTrajectory with a dense ``path`` list.

    Falls back to a 3-point path synthesized from well_summary_all header
    coords for any well that has no directional survey rows.
    """
    if not api_ids:
        return {}

    # Lookup: api_14 → (sh_lat_wgs84, sh_lng_wgs84, bh_lat_wgs84, bh_lng_wgs84)
    well_coords: dict[str, tuple[float, float, float, float]] = {
        w.id: (sh_lat, sh_lng, bh_lat, bh_lng)
        for w, sh_lat, sh_lng, bh_lat, bh_lng in well_data
    }
    # Lookup: api_14 → Well (for lateral_length check)
    well_by_id: dict[str, Well] = {w.id: w for w, *_ in well_data}

    # Only query surveys for wells with lateral_length > 0
    survey_api_ids = [a for a in api_ids if well_by_id.get(a) and well_by_id[a].lateralLength > 0]
    shape_wkts = _fetch_shape_wkts(conn, survey_api_ids)

    survey_table = _validate_table_path("eds.well.tbl_directional_survey", label="survey")

    # ---- Fetch all survey stations ordered by MD ----
    raw_stations: dict[str, list[dict[str, Any]]] = {}  # api_14 → [row_dicts]

    if survey_api_ids:
        survey_params: dict[str, Any] = {}
        api_clause = _build_in_clause("api_14", survey_api_ids, "api", survey_params).strip()
        sql = f"""
            SELECT api_14, measured_depth, true_vertical_depth,
                   north_south_distance, east_west_distance, kickoff_point
            FROM {survey_table}
            WHERE 1 = 1
              {api_clause.strip()}
            ORDER BY api_14, measured_depth
        """

        try:
            with conn.cursor() as cursor:
                cursor.execute(sql, survey_params)
                rows = cursor.fetchall()
                cols = [d[0] for d in cursor.description]
        except Exception as exc:  # noqa: BLE001
            logger.warning("Directional survey query failed, falling back to shape/header trajectories: %s", exc)
            rows = []
            cols = []

        for row in rows:
            rd = dict(zip(cols, row))
            api = str(rd.get("api_14", ""))
            raw_stations.setdefault(api, []).append(rd)

    # ---- Build WellTrajectory for each well ----
    trajectories: dict[str, WellTrajectory] = {}
    for api in api_ids:
        coords = well_coords.get(api)
        if coords is None:
            continue
        sh_lat, sh_lng, bh_lat, bh_lng = coords
        stations = raw_stations.get(api, [])
        shape_wkt = shape_wkts.get(api)

        if shape_wkt:
            shape_trajectory = _trajectory_from_shape_wkt(well_by_id[api], shape_wkt, zoom=zoom)
            if shape_trajectory is not None:
                trajectories[api] = shape_trajectory
                continue

        if stations:
            # Subsample if too many stations (adaptive to zoom)
            stations = _subsample(stations, _max_stations_for_zoom(zoom))

            # Convert each station to a WellTrajectoryPoint
            path: list[WellTrajectoryPoint] = []
            for st in stations:
                ns = st.get("north_south_distance")
                ew = st.get("east_west_distance")
                tvd_raw = st.get("true_vertical_depth")
                ns_ft = float(ns) if ns is not None else 0.0
                ew_ft = float(ew) if ew is not None else 0.0
                tvd = float(tvd_raw) if tvd_raw is not None else 0.0

                pt_lat = sh_lat + (ns_ft / 364000.0)
                pt_lng = sh_lng + (ew_ft / (364000.0 * math.cos(math.radians(sh_lat))))
                path.append(WellTrajectoryPoint(lat=pt_lat, lng=pt_lng, depthFt=tvd))

            surface_pt = path[0]
            toe_pt = path[-1]

            # Heel: station closest to KOP depth
            kop_raw = stations[0].get("kickoff_point")
            if kop_raw is not None:
                kop_depth = float(kop_raw)
                heel_idx = min(
                    range(len(stations)),
                    key=lambda i: abs(
                        (float(stations[i]["measured_depth"]) if stations[i].get("measured_depth") is not None else 0.0)
                        - kop_depth
                    ),
                )
                heel_pt = path[heel_idx]
            else:
                # No KOP — use midpoint of path
                heel_pt = path[len(path) // 2]

            toe_md_raw = stations[-1].get("measured_depth")
            toe_md = float(toe_md_raw) if toe_md_raw is not None else 0.0

            trajectories[api] = WellTrajectory(
                path=path,
                surface=surface_pt,
                heel=heel_pt,
                toe=toe_pt,
                mdFt=toe_md if toe_md > 0 else None,
            )
        else:
            # Fallback: synthesize 3-point path from well header coords
            tvd_estimate = well_by_id[api].lateralLength * 0.8 if well_by_id.get(api) else 8000.0
            surface_pt = WellTrajectoryPoint(lat=sh_lat, lng=sh_lng, depthFt=0.0)
            mid_pt = WellTrajectoryPoint(
                lat=(sh_lat + bh_lat) / 2.0,
                lng=(sh_lng + bh_lng) / 2.0,
                depthFt=tvd_estimate / 2.0,
            )
            toe_pt = WellTrajectoryPoint(lat=bh_lat, lng=bh_lng, depthFt=tvd_estimate)

            trajectories[api] = WellTrajectory(
                path=[surface_pt, mid_pt, toe_pt],
                surface=surface_pt,
                heel=mid_pt,
                toe=toe_pt,
                mdFt=None,
            )

    return trajectories


def _fetch_shape_wkts(conn: Any, api_ids: list[str]) -> dict[str, str]:
    if not api_ids:
        return {}

    try:
        trajectory_table = _trajectory_table_path()
    except ValueError as exc:
        logger.warning("Invalid Databricks trajectory table configuration, falling back to survey/header trajectories: %s", exc)
        return {}

    params: dict[str, Any] = {}
    api_clause = _build_in_clause("api_14", api_ids, "shape_api", params).strip()
    sql = f"""
        SELECT api_14, shape_wkt
        FROM {trajectory_table}
        WHERE 1 = 1
          {api_clause}
          AND shape_wkt IS NOT NULL
    """

    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            rows = cursor.fetchall()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Shape trajectory query failed, falling back to survey/header trajectories: %s", exc)
        return {}

    return {
        str(row[0]): str(row[1])
        for row in rows
        if row[0] is not None and row[1]
    }


def _trajectory_from_shape_wkt(
    well: Well,
    shape_wkt: str,
    zoom: int | None = None,
) -> WellTrajectory | None:
    coords = _parse_linestring_wkt(shape_wkt)
    if len(coords) < 2:
        return None

    transformed = [_transform_coords(lat, lng) for lat, lng in coords]
    if len(transformed) > _max_stations_for_zoom(zoom):
        transformed = _subsample(transformed, _max_stations_for_zoom(zoom))

    tvd_estimate = 8000.0
    if well.lateralLength > 0:
        tvd_estimate = max(4000.0, min(12000.0, well.lateralLength * 0.8))

    heel_index = 1 if len(transformed) <= 2 else max(1, round((len(transformed) - 1) * 0.15))
    path: list[WellTrajectoryPoint] = []
    for idx, (lat, lng) in enumerate(transformed):
        if idx <= heel_index:
            depth = tvd_estimate * (idx / heel_index)
        else:
            depth = tvd_estimate
        path.append(WellTrajectoryPoint(lat=lat, lng=lng, depthFt=depth))

    toe_md = well.lateralLength + tvd_estimate if well.lateralLength > 0 else None
    return WellTrajectory(
        path=path,
        surface=path[0],
        heel=path[heel_index],
        toe=path[-1],
        mdFt=toe_md,
    )


def _parse_linestring_wkt(shape_wkt: str) -> list[tuple[float, float]]:
    normalized = shape_wkt.strip()
    if not normalized.upper().startswith("LINESTRING"):
        return []
    start = normalized.find("(")
    end = normalized.rfind(")")
    if start == -1 or end == -1 or end <= start:
        return []

    coords: list[tuple[float, float]] = []
    for pair in normalized[start + 1:end].split(","):
        parts = pair.strip().split()
        if len(parts) < 2:
            continue
        lng = float(parts[0])
        lat = float(parts[1])
        coords.append((lat, lng))
    return coords


def _query_mock(
    bounds: ViewportBounds,
    filters: SpatialLayerFilter | None,
    limit: int,
    detail_level: DetailLevel = "summary",
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

    if detail_level == "points":
        # Strip to minimal fields for cluster rendering
        wells = [
            Well(id=w.id, name="", lat=w.lat, lng=w.lng, lateralLength=0, status=w.status, operator="", formation="")
            for w in wells
        ]
    elif detail_level == "full":
        wells = [_attach_mock_trajectory(w) for w in wells]

    return SpatialWellsResponse(
        wells=wells,
        total_count=len(wells),
        truncated=truncated,
        source="mock",
    )


def _attach_mock_trajectory(well: Well) -> Well:
    """
    Generate a plausible mock trajectory for a well.
    Horizontal wells get a 90° turn at ~8,000 ft TVD heading east.
    The path field is populated with [surface, heel, toe].
    """
    lateral_ft = well.lateralLength if well.lateralLength > 0 else 7500.0
    kop_tvd = 8000.0
    # Toe is ~lateral_ft east of the heel; convert feet to degrees lng
    lng_offset = lateral_ft / (364000.0 * math.cos(math.radians(well.lat)))

    surface_pt = WellTrajectoryPoint(lat=well.lat, lng=well.lng, depthFt=0.0)
    heel_pt = WellTrajectoryPoint(lat=well.lat, lng=well.lng, depthFt=kop_tvd)
    toe_pt = WellTrajectoryPoint(lat=well.lat, lng=well.lng + lng_offset, depthFt=kop_tvd)
    total_md = kop_tvd + lateral_ft

    return Well(
        id=well.id,
        name=well.name,
        lat=well.lat,
        lng=well.lng,
        lateralLength=well.lateralLength,
        status=well.status,
        operator=well.operator,
        formation=well.formation,
        trajectory=WellTrajectory(
            path=[surface_pt, heel_pt, toe_pt],
            surface=surface_pt,
            heel=heel_pt,
            toe=toe_pt,
            mdFt=total_md,
        ),
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
