from __future__ import annotations

from fastapi import APIRouter

from .spatial_models import SpatialLayersResponse, SpatialWellsRequest, SpatialWellsResponse
from .spatial_service import get_available_layers, get_wells_in_bounds


def create_spatial_router() -> APIRouter:
    router = APIRouter(prefix="/api/spatial", tags=["spatial"])

    @router.post("/wells", response_model=SpatialWellsResponse)
    def spatial_wells(req: SpatialWellsRequest) -> SpatialWellsResponse:
        return get_wells_in_bounds(bounds=req.bounds, filters=req.filters, limit=req.limit)

    @router.get("/layers", response_model=SpatialLayersResponse)
    def spatial_layers() -> SpatialLayersResponse:
        return get_available_layers()

    return router
