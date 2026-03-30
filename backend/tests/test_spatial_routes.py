import os

from fastapi.testclient import TestClient

import backend.spatial_service as _svc
from backend.spatial_service import _cache

# Force mock mode before app creation
for _k in ("DATABRICKS_SERVER_HOSTNAME", "DATABRICKS_HTTP_PATH", "DATABRICKS_TOKEN"):
    os.environ.pop(_k, None)
_svc._db_connection = None

from backend.main import create_app


def setup_function():
    _cache.clear()
    for _k in ("DATABRICKS_SERVER_HOSTNAME", "DATABRICKS_HTTP_PATH", "DATABRICKS_TOKEN"):
        os.environ.pop(_k, None)
    _svc._db_connection = None


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
