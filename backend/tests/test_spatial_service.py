import os

from backend.spatial_models import SpatialLayerFilter, ViewportBounds
from backend.models import Well
from backend.spatial_service import (
    get_available_layers,
    get_wells_in_bounds,
    _cache,
    ConnectionManager,
    _SpatialResponseCache,
    _cache_key,
    _normalize_bounds_for_cache,
    _query_databricks,
    _sample_wells_deterministically,
    _simplify_trajectory_points,
)
import backend.spatial_service as _svc


def _wide_bounds() -> ViewportBounds:
    """Bounds that cover the entire Permian Basin mock area."""
    return ViewportBounds(sw_lat=31.0, sw_lng=-103.0, ne_lat=33.0, ne_lng=-101.0)


def _narrow_bounds() -> ViewportBounds:
    """Bounds that cover only a small slice — should return fewer wells."""
    return ViewportBounds(sw_lat=31.88, sw_lng=-102.35, ne_lat=31.92, ne_lng=-102.25)


def setup_function():
    """Clear the cache and force mock mode by removing DB env vars."""
    _cache.clear()
    # Force mock fallback by clearing credentials and resetting connection manager
    for key in (
        "DATABRICKS_SERVER_HOSTNAME",
        "DATABRICKS_HTTP_PATH",
        "DATABRICKS_TOKEN",
        "DATABRICKS_HOST",
        "DATABRICKS_WAREHOUSE_ID",
        "DATABRICKS_ACCESS_TOKEN",
    ):
        os.environ.pop(key, None)
    _svc._conn_mgr = ConnectionManager()


def test_mock_fallback_returns_wells():
    resp = get_wells_in_bounds(bounds=_wide_bounds())
    assert resp.source == "mock"
    assert len(resp.wells) > 0
    assert resp.total_count == len(resp.wells)
    # All 40 mock wells should be within wide bounds
    assert len(resp.wells) == 40


def test_mock_filters_by_bounds():
    wide = get_wells_in_bounds(bounds=_wide_bounds())
    narrow = get_wells_in_bounds(bounds=_narrow_bounds())
    assert len(narrow.wells) < len(wide.wells)
    # Every returned well must be within the narrow bounds
    b = _narrow_bounds()
    for w in narrow.wells:
        assert b.sw_lat <= w.lat <= b.ne_lat
        assert b.sw_lng <= w.lng <= b.ne_lng


def test_mock_filters_by_status():
    filters = SpatialLayerFilter(statuses=["PRODUCING"])
    resp = get_wells_in_bounds(bounds=_wide_bounds(), filters=filters)
    assert resp.source == "mock"
    assert len(resp.wells) > 0
    for w in resp.wells:
        assert w.status == "PRODUCING"


def test_mock_truncation():
    resp = get_wells_in_bounds(bounds=_wide_bounds(), limit=5)
    assert resp.truncated is True
    assert len(resp.wells) == 5


def test_available_layers():
    resp = get_available_layers()
    assert len(resp.layers) == 4
    ids = [layer.id for layer in resp.layers]
    assert "producing" in ids
    assert "duc" in ids
    assert "permit" in ids
    assert "laterals" in ids
    # laterals are default-on; render budgets and zoom thresholds keep them light.
    laterals = next(l for l in resp.layers if l.id == "laterals")
    assert laterals.enabled_by_default is True


def test_cache_returns_same():
    bounds = _wide_bounds()
    resp1 = get_wells_in_bounds(bounds=bounds)
    resp2 = get_wells_in_bounds(bounds=bounds)
    # Should be the exact same object from cache
    assert resp1 is resp2


def test_mock_trajectory_not_attached_by_default():
    resp = get_wells_in_bounds(bounds=_wide_bounds())
    assert resp.source == "mock"
    for w in resp.wells:
        assert w.trajectory is None


def test_mock_trajectory_attached_when_requested():
    resp = get_wells_in_bounds(bounds=_wide_bounds(), include_trajectory=True)
    assert resp.source == "mock"
    assert len(resp.wells) > 0
    for w in resp.wells:
        assert w.trajectory is not None
        t = w.trajectory
        # Surface must be at depth 0 at the well's own coordinates
        assert t.surface.depthFt == 0.0
        assert t.surface.lat == w.lat
        assert t.surface.lng == w.lng
        # Heel and toe must be deeper than surface
        assert t.heel.depthFt > 0.0
        assert t.toe.depthFt > 0.0
        # Toe should be eastward of heel (mock always goes east)
        assert t.toe.lng > t.heel.lng
        # mdFt should reflect the full wellbore length
        assert t.mdFt is not None
        assert t.mdFt > 0.0
        # path must be populated and include at least the 3 key points
        assert len(t.path) >= 3
        assert t.path[0].depthFt == 0.0  # first point is surface


def test_trajectory_cache_is_separate_from_non_trajectory():
    """include_trajectory=True and False must not share a cache entry."""
    bounds = _wide_bounds()
    resp_no_traj = get_wells_in_bounds(bounds=bounds, include_trajectory=False)
    resp_traj = get_wells_in_bounds(bounds=bounds, include_trajectory=True)
    assert resp_no_traj is not resp_traj
    for w in resp_no_traj.wells:
        assert w.trajectory is None
    for w in resp_traj.wells:
        assert w.trajectory is not None


def test_detail_level_points_strips_fields():
    """detail_level='points' should return only id/lat/lng/status — no name, operator, formation."""
    resp = get_wells_in_bounds(bounds=_wide_bounds(), detail_level="points")
    assert resp.source == "mock"
    assert len(resp.wells) > 0
    for w in resp.wells:
        assert w.name == ""
        assert w.operator == ""
        assert w.formation == ""
        assert w.lateralLength == 0
        assert w.trajectory is None
        # Core fields must still be populated
        assert w.id != ""
        assert w.lat != 0.0
        assert w.lng != 0.0
        assert w.status in ("PRODUCING", "DUC", "PERMIT")


def test_detail_level_summary_has_full_fields():
    """detail_level='summary' (default) should return all well fields without trajectory."""
    resp = get_wells_in_bounds(bounds=_wide_bounds(), detail_level="summary")
    assert resp.source == "mock"
    for w in resp.wells:
        assert w.name != ""
        assert w.operator != ""
        assert w.formation != ""
        assert w.trajectory is None


def test_detail_level_full_attaches_trajectory():
    """detail_level='full' should attach trajectory to every well."""
    resp = get_wells_in_bounds(bounds=_wide_bounds(), detail_level="full")
    assert resp.source == "mock"
    for w in resp.wells:
        assert w.trajectory is not None


def test_detail_level_caches_independently():
    """points and summary must not share a cache entry."""
    bounds = _wide_bounds()
    resp_points = get_wells_in_bounds(bounds=bounds, detail_level="points")
    resp_summary = get_wells_in_bounds(bounds=bounds, detail_level="summary")
    assert resp_points is not resp_summary


def test_include_trajectory_backward_compat_implies_full():
    """include_trajectory=True without explicit detail_level must behave as detail_level='full'."""
    resp = get_wells_in_bounds(bounds=_wide_bounds(), include_trajectory=True)
    assert resp.source == "mock"
    for w in resp.wells:
        assert w.trajectory is not None


def test_include_trajectory_does_not_override_explicit_full():
    """include_trajectory=True with detail_level='full' should still work correctly."""
    resp = get_wells_in_bounds(bounds=_wide_bounds(), include_trajectory=True, detail_level="full")
    assert resp.source == "mock"
    for w in resp.wells:
        assert w.trajectory is not None


def test_cache_key_normalizes_tiny_bounds_shifts():
    first = _cache_key(
        ViewportBounds(sw_lat=31.0001, sw_lng=-103.0001, ne_lat=33.0001, ne_lng=-101.0001),
        None,
        2000,
        "summary",
        zoom=11,
        render_profile="sampled",
    )
    second = _cache_key(
        ViewportBounds(sw_lat=31.0002, sw_lng=-103.0002, ne_lat=33.0002, ne_lng=-101.0002),
        None,
        2000,
        "summary",
        zoom=11,
        render_profile="sampled",
    )

    assert second == first


def test_normalized_bounds_expand_to_tile_bucket():
    bounds = _normalize_bounds_for_cache(
        ViewportBounds(sw_lat=31.01, sw_lng=-102.99, ne_lat=31.12, ne_lng=-102.88),
        zoom=12,
    )

    assert bounds.sw_lat <= 31.01
    assert bounds.sw_lng <= -102.99
    assert bounds.ne_lat >= 31.12
    assert bounds.ne_lng >= -102.88


def test_deterministic_sampling_is_order_independent_and_prioritizes_ids():
    wells = [
        Well(
            id=f"w-{i}",
            name=f"Well {i}",
            lat=31.0 + i * 0.001,
            lng=-102.0,
            lateralLength=7500,
            status="PRODUCING",
            operator="Test",
            formation="Wolfcamp A",
        )
        for i in range(20)
    ]

    first = _sample_wells_deterministically(
        wells,
        budget=5,
        seed="z12|PRODUCING",
        priority_ids={"w-19"},
    )
    second = _sample_wells_deterministically(
        list(reversed(wells)),
        budget=5,
        seed="z12|PRODUCING",
        priority_ids={"w-19"},
    )

    assert [well.id for well in second] == [well.id for well in first]
    assert first[0].id == "w-19"


def test_render_profile_sampled_applies_deterministic_cap():
    resp = get_wells_in_bounds(
        bounds=_wide_bounds(),
        detail_level="summary",
        render_profile="sampled",
        limit=40,
    )

    assert resp.source == "mock"
    assert len(resp.wells) < 40


# ---------------------------------------------------------------------------
# ConnectionManager unit tests
# ---------------------------------------------------------------------------

import time
from unittest.mock import MagicMock, patch

from backend.spatial_service import check_connection_status


class TestConnectionManager:
    """Tests for the ConnectionManager reconnect / health-check logic."""

    def setup_method(self):
        self.mgr = ConnectionManager()

    def test_initial_state(self):
        assert self.mgr.status == "disconnected"
        assert self.mgr.connection is None
        assert self.mgr.reconnect_attempts == 0
        assert self.mgr.error is None
        assert self.mgr.last_verified_at == 0.0

    def test_get_connection_returns_none_without_credentials(self):
        for key in (
            "DATABRICKS_SERVER_HOSTNAME",
            "DATABRICKS_HTTP_PATH",
            "DATABRICKS_TOKEN",
            "DATABRICKS_HOST",
            "DATABRICKS_WAREHOUSE_ID",
            "DATABRICKS_ACCESS_TOKEN",
        ):
            os.environ.pop(key, None)
        result = self.mgr.get_connection()
        assert result is None
        assert self.mgr.status == "disconnected"
        assert self.mgr.error == "Databricks credentials not configured"

    def test_successful_connection_uses_host_and_warehouse_fallbacks(self):
        os.environ.pop("DATABRICKS_SERVER_HOSTNAME", None)
        os.environ.pop("DATABRICKS_HTTP_PATH", None)
        os.environ["DATABRICKS_HOST"] = "https://workspace.example.com/"
        os.environ["DATABRICKS_WAREHOUSE_ID"] = "abc123"
        os.environ["DATABRICKS_ACCESS_TOKEN"] = "tok456"
        os.environ.pop("DATABRICKS_TOKEN", None)

        mock_conn = MagicMock()
        mock_sql_mod = MagicMock()
        mock_sql_mod.connect.return_value = mock_conn
        mock_databricks = MagicMock()
        mock_databricks.sql = mock_sql_mod

        with patch.dict("sys.modules", {
            "databricks": mock_databricks,
            "databricks.sql": mock_sql_mod,
        }):
            result = self.mgr.get_connection()
            assert result is mock_conn

        mock_sql_mod.connect.assert_called_once_with(
            server_hostname="workspace.example.com",
            http_path="/sql/1.0/warehouses/abc123",
            access_token="tok456",
            _socket_timeout=ConnectionManager._CONNECT_TIMEOUT,
        )

    def test_successful_connection(self):
        os.environ["DATABRICKS_SERVER_HOSTNAME"] = "host.test"
        os.environ["DATABRICKS_HTTP_PATH"] = "/sql/1.0/warehouses/abc"
        os.environ["DATABRICKS_TOKEN"] = "tok123"

        mock_conn = MagicMock()
        mock_sql_mod = MagicMock()
        mock_sql_mod.connect.return_value = mock_conn
        mock_databricks = MagicMock()
        mock_databricks.sql = mock_sql_mod

        with patch.dict("sys.modules", {
            "databricks": mock_databricks,
            "databricks.sql": mock_sql_mod,
        }):
            result = self.mgr.get_connection()
            assert result is mock_conn
            assert self.mgr.status == "connected"
            assert self.mgr.reconnect_attempts == 0
            assert self.mgr.error is None
            assert self.mgr.last_verified_at > 0

    def test_reconnect_increments_attempts_on_failure(self):
        os.environ["DATABRICKS_SERVER_HOSTNAME"] = "host.test"
        os.environ["DATABRICKS_HTTP_PATH"] = "/sql/1.0/warehouses/abc"
        os.environ["DATABRICKS_TOKEN"] = "tok123"

        mock_sql_mod = MagicMock()
        mock_sql_mod.connect.side_effect = Exception("warehouse suspended")
        mock_databricks = MagicMock()
        mock_databricks.sql = mock_sql_mod

        with patch.dict("sys.modules", {
            "databricks": mock_databricks,
            "databricks.sql": mock_sql_mod,
        }):
            result = self.mgr.get_connection()
            assert result is None
            assert self.mgr.status == "disconnected"
            assert self.mgr.reconnect_attempts == ConnectionManager._MAX_RECONNECT_ATTEMPTS
            assert "warehouse suspended" in self.mgr.error

    def test_ping_success_updates_last_verified(self):
        mock_conn = MagicMock()
        self.mgr.connection = mock_conn
        self.mgr.status = "connected"
        self.mgr.last_verified_at = 0  # force ping

        assert self.mgr._ping() is True
        assert self.mgr.last_verified_at > 0
        mock_conn.cursor.return_value.__enter__.return_value.execute.assert_called_once_with(
            "SELECT 1"
        )

    def test_ping_failure_disconnects(self):
        mock_conn = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value.execute.side_effect = Exception("timeout")
        self.mgr.connection = mock_conn
        self.mgr.status = "connected"

        assert self.mgr._ping() is False
        assert self.mgr.status == "disconnected"
        assert self.mgr.connection is None
        assert "timeout" in self.mgr.error

    def test_get_connection_triggers_ping_after_interval(self):
        mock_conn = MagicMock()
        self.mgr.connection = mock_conn
        self.mgr.status = "connected"
        # last verified long ago — should trigger ping
        self.mgr.last_verified_at = time.time() - 120

        result = self.mgr.get_connection()
        assert result is mock_conn
        # Ping should have been called (cursor used)
        mock_conn.cursor.assert_called()

    def test_get_connection_skips_ping_when_recent(self):
        mock_conn = MagicMock()
        self.mgr.connection = mock_conn
        self.mgr.status = "connected"
        self.mgr.last_verified_at = time.time()  # just now

        result = self.mgr.get_connection()
        assert result is mock_conn
        # No ping — cursor should not have been used
        mock_conn.cursor.assert_not_called()

    def test_close_existing_handles_exceptions(self):
        mock_conn = MagicMock()
        mock_conn.close.side_effect = Exception("already closed")
        self.mgr.connection = mock_conn

        # Should not raise
        self.mgr._close_existing()
        assert self.mgr.connection is None


class TestCheckConnectionStatus:
    """Tests for the check_connection_status() function."""

    def setup_method(self):
        _cache.clear()
        for key in (
            "DATABRICKS_SERVER_HOSTNAME",
            "DATABRICKS_HTTP_PATH",
            "DATABRICKS_TOKEN",
            "DATABRICKS_HOST",
            "DATABRICKS_WAREHOUSE_ID",
            "DATABRICKS_ACCESS_TOKEN",
        ):
            os.environ.pop(key, None)
        _svc._conn_mgr = ConnectionManager()

    def test_no_credentials_returns_mock(self):
        status = check_connection_status()
        assert status["connected"] is False
        assert status["source"] == "mock"
        assert status["last_verified_at"] is None
        assert status["reconnect_attempts"] == 0

    def test_connected_returns_databricks_with_metadata(self):
        os.environ["DATABRICKS_SERVER_HOSTNAME"] = "host.test"
        mock_conn = MagicMock()
        _svc._conn_mgr.connection = mock_conn
        _svc._conn_mgr.status = "connected"
        _svc._conn_mgr.last_verified_at = time.time()  # recent, so ping is skipped
        _svc._conn_mgr.reconnect_attempts = 0

        status = check_connection_status()
        assert status["connected"] is True
        assert status["source"] == "databricks"
        assert status["last_verified_at"] is not None
        assert status["last_verified_at"] > 0
        assert status["reconnect_attempts"] == 0

    def test_disconnected_with_error(self):
        os.environ["DATABRICKS_SERVER_HOSTNAME"] = "host.test"
        _svc._conn_mgr.error = "warehouse suspended"
        _svc._conn_mgr.reconnect_attempts = 2

        # Patch _get_db_connection to return None without triggering reconnect
        with patch.object(_svc, "_get_db_connection", return_value=None):
            status = check_connection_status()
        assert status["connected"] is False
        assert status["error"] == "warehouse suspended"
        assert status["reconnect_attempts"] == 2


# ---------------------------------------------------------------------------
# Adaptive trajectory station count tests (Step 2.3)
# ---------------------------------------------------------------------------

from backend.spatial_service import _max_stations_for_zoom


class TestAdaptiveStationCount:
    def test_none_zoom_returns_default(self):
        assert _max_stations_for_zoom(None) == 50

    def test_zoom_12_returns_20(self):
        assert _max_stations_for_zoom(12) == 20

    def test_zoom_13_returns_20(self):
        assert _max_stations_for_zoom(13) == 20

    def test_zoom_14_returns_35(self):
        assert _max_stations_for_zoom(14) == 35

    def test_zoom_15_returns_35(self):
        assert _max_stations_for_zoom(15) == 35

    def test_zoom_16_returns_50(self):
        assert _max_stations_for_zoom(16) == 50

    def test_zoom_20_returns_50(self):
        assert _max_stations_for_zoom(20) == 50

    def test_zoom_10_returns_20(self):
        """Low zoom still gets minimum stations."""
        assert _max_stations_for_zoom(10) == 20


class TestZoomPassedToWells:
    """Verify zoom parameter accepted by get_wells_in_bounds (mock mode)."""

    def setup_method(self):
        _cache.clear()
        for key in (
            "DATABRICKS_SERVER_HOSTNAME",
            "DATABRICKS_HTTP_PATH",
            "DATABRICKS_TOKEN",
            "DATABRICKS_HOST",
            "DATABRICKS_WAREHOUSE_ID",
            "DATABRICKS_ACCESS_TOKEN",
        ):
            os.environ.pop(key, None)
        _svc._conn_mgr = ConnectionManager()

    def test_zoom_accepted_without_error(self):
        resp = get_wells_in_bounds(bounds=_wide_bounds(), zoom=14)
        assert resp.source == "mock"
        assert len(resp.wells) > 0

    def test_zoom_none_accepted(self):
        resp = get_wells_in_bounds(bounds=_wide_bounds(), zoom=None)
        assert resp.source == "mock"


class TestShapeTrajectoryBuilder:
    def test_shape_wkt_builds_realistic_trajectory_points(self):
        well = Well(
            id="42317408960000",
            name="Shape-backed well",
            lat=32.474791,
            lng=-101.728186,
            lateralLength=10351.0,
            status="PRODUCING",
            operator="SM ENERGY COMPANY",
            formation="WOLFCAMP B",
        )

        trajectory = _svc._trajectory_from_shape_wkt(
            well,
            "LINESTRING (-101.72818899988938 32.474790000121516, -101.72411043708378 32.4581834942993, -101.71959982050538 32.445128026002649)",
            zoom=14,
        )

        assert trajectory is not None
        assert len(trajectory.path) == 3
        assert trajectory.surface.depthFt == 0.0
        assert trajectory.heel.depthFt > 0.0
        assert trajectory.toe.depthFt >= trajectory.heel.depthFt
        assert trajectory.surface.lng != trajectory.toe.lng
        assert trajectory.mdFt is not None
        assert trajectory.mdFt > well.lateralLength

    def test_well_master_points_build_surface_heel_toe_trajectory(self):
        well = Well(
            id="42317408960000",
            name="Coordinate-backed well",
            lat=32.10,
            lng=-102.10,
            lateralLength=10000.0,
            status="PRODUCING",
            operator="TEST OPERATOR",
            formation="WOLFCAMP A",
        )

        trajectory = _svc._trajectory_from_well_master_points(
            well,
            {
                "surface_latitude": 32.10,
                "surface_longitude": -102.10,
                "heel_latitude": 32.09,
                "heel_longitude": -102.08,
                "toe_latitude": 32.06,
                "toe_longitude": -102.00,
                "tvd_ft": 9500,
            },
            sh_lat=32.10,
            sh_lng=-102.10,
            bh_lat=32.06,
            bh_lng=-102.00,
        )

        assert trajectory is not None
        assert trajectory.surface.depthFt == 0.0
        assert trajectory.heel.depthFt == 9500
        assert trajectory.toe.depthFt == 9500
        assert trajectory.path == [trajectory.surface, trajectory.heel, trajectory.toe]
        assert trajectory.mdFt == 19500

    def test_well_master_points_fall_back_to_bottomhole_when_toe_missing(self):
        well = Well(
            id="42317408960001",
            name="Bottomhole-backed well",
            lat=32.10,
            lng=-102.10,
            lateralLength=7500.0,
            status="DUC",
            operator="TEST OPERATOR",
            formation="WOLFCAMP B",
        )

        trajectory = _svc._trajectory_from_well_master_points(
            well,
            {
                "sh_latitude": 32.10,
                "sh_longitude": -102.10,
                "bottom_hole_latitude": 32.02,
                "bottom_hole_longitude": -102.00,
            },
            sh_lat=32.10,
            sh_lng=-102.10,
            bh_lat=32.02,
            bh_lng=-102.00,
        )

        assert trajectory is not None
        assert trajectory.toe.lat == 32.02
        assert trajectory.toe.lng == -102.00
        assert trajectory.heel.depthFt == trajectory.toe.depthFt
        assert trajectory.toe.depthFt > 0


class TestResponseCacheBounds:
    def test_cache_evicts_least_recently_used_entry(self):
        now = 100.0
        cache = _SpatialResponseCache(max_entries=2, ttl_seconds=60.0, timer=lambda: now)

        cache.set("a", "alpha")
        cache.set("b", "bravo")
        assert cache.get("a") == "alpha"

        cache.set("c", "charlie")

        assert cache.get("b") is None
        assert cache.get("a") == "alpha"
        assert cache.get("c") == "charlie"

    def test_cache_expires_entries_after_ttl(self):
        now = 100.0

        def timer():
            return now

        cache = _SpatialResponseCache(max_entries=2, ttl_seconds=5.0, timer=timer)
        cache.set("a", "alpha")

        now = 106.0

        assert cache.get("a") is None
        assert "a" not in cache


class TestTrajectorySimplification:
    def test_simplification_reduces_noise_but_keeps_significant_bend(self):
        points = [
            _svc.WellTrajectoryPoint(lat=0.0, lng=0.0, depthFt=0.0),
            _svc.WellTrajectoryPoint(lat=1.0, lng=0.02, depthFt=1000.0),
            _svc.WellTrajectoryPoint(lat=2.0, lng=-0.01, depthFt=2000.0),
            _svc.WellTrajectoryPoint(lat=3.0, lng=3.0, depthFt=3000.0),
            _svc.WellTrajectoryPoint(lat=4.0, lng=0.01, depthFt=4000.0),
            _svc.WellTrajectoryPoint(lat=5.0, lng=-0.02, depthFt=5000.0),
            _svc.WellTrajectoryPoint(lat=6.0, lng=0.0, depthFt=6000.0),
        ]

        simplified = _simplify_trajectory_points(points, max_count=5, tolerance=0.25)

        assert len(simplified) < len(points)
        assert simplified[0] is points[0]
        assert simplified[-1] is points[-1]
        assert points[3] in simplified


class _CapturingCursor:
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

    def __init__(self):
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
        return []


class _CapturingConnection:
    def __init__(self):
        self.cursor_instance = _CapturingCursor()

    def cursor(self):
        return self.cursor_instance


class TestDatabricksSqlFilters:
    def test_status_filter_is_pushed_into_sql_with_bound_params(self):
        conn = _CapturingConnection()

        _query_databricks(
            conn,
            _wide_bounds(),
            SpatialLayerFilter(statuses=["PRODUCING", "DUC"]),
            10,
            detail_level="summary",
        )

        sql = conn.cursor_instance.sql
        params = conn.cursor_instance.params
        assert "well_status" in sql
        assert "%(status_0)s" in sql
        assert "%(status_1)s" in sql
        assert params["status_0"] == "PRODUCING"
        assert params["status_1"] == "DUC"
