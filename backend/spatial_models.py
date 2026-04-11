from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from .models import Well, WellStatus

DetailLevel = Literal["points", "summary", "full"]


class ViewportBounds(BaseModel):
    sw_lat: float = Field(..., ge=-90, le=90, description="Southwest latitude")
    sw_lng: float = Field(..., ge=-180, le=180, description="Southwest longitude")
    ne_lat: float = Field(..., ge=-90, le=90, description="Northeast latitude")
    ne_lng: float = Field(..., ge=-180, le=180, description="Northeast longitude")


class SpatialLayerFilter(BaseModel):
    statuses: list[WellStatus] | None = None
    operators: list[str] | None = None
    formations: list[str] | None = None
    layers: list[str] | None = None


class SpatialWellsRequest(BaseModel):
    bounds: ViewportBounds
    filters: SpatialLayerFilter | None = None
    limit: int = Field(2000, ge=1, le=10000)
    include_trajectory: bool = False  # kept for backward compat
    detail_level: DetailLevel = "summary"
    zoom: int | None = Field(None, ge=0, le=24, description="Map zoom level — controls trajectory station density")


class SpatialWellsResponse(BaseModel):
    wells: list[Well]
    total_count: int
    truncated: bool
    source: Literal["databricks", "mock"]


class SpatialLayer(BaseModel):
    id: str
    label: str
    description: str
    enabled_by_default: bool


class SpatialLayersResponse(BaseModel):
    layers: list[SpatialLayer]


class SpatialStatusResponse(BaseModel):
    connected: bool
    source: str  # 'databricks' | 'mock' | 'unavailable'
    error: str | None = None
    table: str | None = None
    last_verified_at: float | None = None
    reconnect_attempts: int = 0
