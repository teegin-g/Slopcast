from backend.spatial_models import SpatialLayerFilter, ViewportBounds
from backend.spatial_service import get_available_layers, get_wells_in_bounds, _cache


def _wide_bounds() -> ViewportBounds:
    """Bounds that cover the entire Permian Basin mock area."""
    return ViewportBounds(sw_lat=31.0, sw_lng=-103.0, ne_lat=33.0, ne_lng=-101.0)


def _narrow_bounds() -> ViewportBounds:
    """Bounds that cover only a small slice — should return fewer wells."""
    return ViewportBounds(sw_lat=31.88, sw_lng=-102.35, ne_lat=31.92, ne_lng=-102.25)


def setup_function():
    """Clear the cache before each test."""
    _cache.clear()


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
    # laterals should be disabled by default
    laterals = next(l for l in resp.layers if l.id == "laterals")
    assert laterals.enabled_by_default is False


def test_cache_returns_same():
    bounds = _wide_bounds()
    resp1 = get_wells_in_bounds(bounds=bounds)
    resp2 = get_wells_in_bounds(bounds=bounds)
    # Should be the exact same object from cache
    assert resp1 is resp2
