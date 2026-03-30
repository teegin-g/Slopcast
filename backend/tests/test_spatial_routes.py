from fastapi.testclient import TestClient

from backend.main import create_app
from backend.spatial_service import _cache


def setup_function():
    _cache.clear()


client = TestClient(create_app())


def test_spatial_wells_endpoint():
    resp = client.post(
        "/api/spatial/wells",
        json={
            "bounds": {
                "sw_lat": 31.0,
                "sw_lng": -103.0,
                "ne_lat": 33.0,
                "ne_lng": -101.0,
            }
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "wells" in data
    assert data["source"] == "mock"
    assert len(data["wells"]) == 40


def test_spatial_layers_endpoint():
    resp = client.get("/api/spatial/layers")
    assert resp.status_code == 200
    data = resp.json()
    assert "layers" in data
    assert len(data["layers"]) == 4


def test_invalid_bounds():
    resp = client.post(
        "/api/spatial/wells",
        json={
            "bounds": {
                "sw_lat": -100.0,  # out of range: must be >= -90
                "sw_lng": -103.0,
                "ne_lat": 33.0,
                "ne_lng": -101.0,
            }
        },
    )
    assert resp.status_code == 422
