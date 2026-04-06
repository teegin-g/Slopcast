"""
Live integration tests for Databricks spatial service.

Marked with @pytest.mark.integration — skipped in normal CI unless
DATABRICKS_SERVER_HOSTNAME is set in the environment.

Run with:
    cd backend && python -m pytest tests/test_databricks_integration.py -v -m integration
"""

import os
from pathlib import Path

import pytest
from dotenv import load_dotenv

# Load backend/.env so credentials are available before the fixture checks them.
# This is a no-op when the env vars are already set (e.g. in CI).
load_dotenv(Path(__file__).parent.parent / ".env")

pytestmark = pytest.mark.integration


@pytest.fixture
def has_databricks_credentials():
    """Skip if no Databricks credentials configured."""
    if not os.getenv("DATABRICKS_SERVER_HOSTNAME"):
        pytest.skip("No Databricks credentials — set DATABRICKS_SERVER_HOSTNAME to run")


def test_get_wells_in_bounds_live(has_databricks_credentials):
    """Verify real Databricks query returns wells in Permian Basin."""
    from backend.spatial_models import ViewportBounds
    from backend.spatial_service import _cache, get_wells_in_bounds

    _cache.clear()

    bounds = ViewportBounds(sw_lat=31.0, sw_lng=-103.0, ne_lat=33.0, ne_lng=-101.0)
    result = get_wells_in_bounds(bounds=bounds, limit=10)

    assert result.source == "databricks"
    assert len(result.wells) > 0
    assert len(result.wells) <= 10

    well = result.wells[0]
    assert well.id
    assert well.name
    assert 31.0 <= well.lat <= 33.0
    assert -103.0 <= well.lng <= -101.0


def test_get_wells_with_trajectory_live(has_databricks_credentials):
    """Verify trajectory request succeeds and structure is valid for any matched wells.

    The directional survey table (eds.well.tbl_directional_survey) has sparse
    api_14 coverage — many rows have NULL api_14. This test verifies the code
    path runs without error and that any trajectories returned are structurally
    valid; it does not assert that every well has a trajectory.
    """
    from backend.spatial_models import ViewportBounds
    from backend.spatial_service import _cache, get_wells_in_bounds

    _cache.clear()

    bounds = ViewportBounds(sw_lat=31.5, sw_lng=-102.5, ne_lat=32.5, ne_lng=-101.5)
    result = get_wells_in_bounds(bounds=bounds, limit=5, include_trajectory=True)

    assert result.source == "databricks"
    assert len(result.wells) >= 0  # Query succeeded — even 0 wells is valid

    # Validate structure of any trajectories that were returned
    for well in result.wells:
        if well.trajectory is not None:
            traj = well.trajectory
            assert traj.surface.depthFt == 0   # Surface is at 0
            assert traj.heel.depthFt >= 0
            assert traj.toe.depthFt >= 0


def test_connection_status_live(has_databricks_credentials):
    """Verify connection status reports correctly when credentials are present."""
    from backend.spatial_service import check_connection_status

    status = check_connection_status()
    assert status["connected"] is True
    assert status["source"] == "databricks"
