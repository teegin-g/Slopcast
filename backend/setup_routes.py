from __future__ import annotations

from fastapi import APIRouter

from .setup_models import (
    CountRequest,
    CountResponse,
    FieldStatsRequest,
    FieldStatsResponse,
    FieldValuesResponse,
    InterpretRequest,
    InterpretResponse,
    PresetsResponse,
    SchemaResponse,
)
from .setup_service import (
    estimate_count,
    get_field_stats,
    get_field_values,
    get_presets,
    get_schema,
    interpret_query,
)


def create_setup_router() -> APIRouter:
    """Routes backing the Project Setup / Launchpad surface (/setup)."""
    router = APIRouter(prefix="/api/setup", tags=["setup"])

    @router.get("/schema", response_model=SchemaResponse)
    def setup_schema() -> SchemaResponse:
        return get_schema()

    @router.get("/values/{field}", response_model=FieldValuesResponse)
    def setup_field_values(field: str, limit: int = 400) -> FieldValuesResponse:
        return get_field_values(field, limit=limit)

    @router.post("/field-stats", response_model=FieldStatsResponse)
    def setup_field_stats(req: FieldStatsRequest) -> FieldStatsResponse:
        return get_field_stats(req.field, req.basin, req.filters)

    @router.post("/count", response_model=CountResponse)
    def setup_count(req: CountRequest) -> CountResponse:
        return estimate_count(req.basin, req.filters)

    @router.post("/interpret", response_model=InterpretResponse)
    def setup_interpret(req: InterpretRequest) -> InterpretResponse:
        return interpret_query(req.query, req.basin)

    @router.get("/presets", response_model=PresetsResponse)
    def setup_presets(basin: str | None = None) -> PresetsResponse:
        return get_presets(basin)

    return router
