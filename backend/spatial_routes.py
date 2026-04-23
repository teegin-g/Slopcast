from __future__ import annotations

from fastapi import APIRouter

from .spatial_models import (
    SpatialLayersResponse,
    SpatialStatusResponse,
    SpatialWellsRequest,
    SpatialWellsResponse,
)
from .spatial_service import check_connection_status, get_available_layers, get_wells_in_bounds


def create_spatial_router() -> APIRouter:
    router = APIRouter(prefix="/api/spatial", tags=["spatial"])

    @router.post("/wells", response_model=SpatialWellsResponse)
    def spatial_wells(req: SpatialWellsRequest) -> SpatialWellsResponse:
        # Backward compat: include_trajectory=True implies full
        detail = req.detail_level
        if req.include_trajectory and detail != "full":
            detail = "full"
        return get_wells_in_bounds(
            bounds=req.bounds,
            filters=req.filters,
            limit=req.limit,
            detail_level=detail,
            zoom=req.zoom,
        )

    @router.get("/layers", response_model=SpatialLayersResponse)
    def spatial_layers() -> SpatialLayersResponse:
        return get_available_layers()

    @router.get("/status", response_model=SpatialStatusResponse)
    def spatial_status() -> SpatialStatusResponse:
        status = check_connection_status()
        return SpatialStatusResponse(**status)

    return router
