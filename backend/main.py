from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .economics import aggregate_economics, calculate_economics
from .models import (
    AggregateEconomicsRequest,
    CalculateEconomicsRequest,
    EconomicsResponse,
    Scalars,
    SensitivityMatrixRequest,
    SensitivityMatrixResult,
)
from .sensitivity import generate_sensitivity_matrix
from .spatial_routes import create_spatial_router
from .spatial_service import SpatialDBManager


def create_app() -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.spatial_db = SpatialDBManager()
        yield
        app.state.spatial_db.disconnect()

    app = FastAPI(title="Slopcast Backend", version="0.1.0", lifespan=lifespan)

    # Local-dev CORS: Vite (default :3000; alternate :3001 if busy), and direct tooling on :5173.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://127.0.0.1:3000",
            "http://localhost:3000",
            "http://127.0.0.1:3001",
            "http://localhost:3001",
            "http://127.0.0.1:5173",
            "http://localhost:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health(request: Request) -> dict:
        return {"ok": True, "spatial_db": request.app.state.spatial_db.health()}

    # DEV-COMPARISON: /api/economics/* and /api/sensitivity/* are reachable only via the
    # dev-only engine toggle in DebugOverlay (R4-01). The Python engine is the retained
    # reference implementation — kept intentionally for parity comparison against the
    # authoritative TypeScript engine. Do not delete these routes.
    @app.post("/api/economics/calculate", response_model=EconomicsResponse)
    def economics_calculate(req: CalculateEconomicsRequest) -> EconomicsResponse:
        scalars = req.scalars or Scalars()
        return calculate_economics(
            selected_wells=req.wells,
            tc=req.typeCurve,
            capex=req.capex,
            pricing=req.pricing,
            opex=req.opex,
            ownership=req.ownership,
            scalars=scalars,
            schedule_override=req.scheduleOverride,
            tax_assumptions=req.taxAssumptions,
            debt_assumptions=req.debtAssumptions,
            reserve_category=req.reserveCategory,
        )

    @app.post("/api/economics/aggregate", response_model=EconomicsResponse)
    def economics_aggregate(req: AggregateEconomicsRequest) -> EconomicsResponse:
        return aggregate_economics(req.groups)

    @app.post(
        "/api/sensitivity/matrix",
        response_model=list[list[SensitivityMatrixResult]],
    )
    def sensitivity_matrix(req: SensitivityMatrixRequest) -> list[list[SensitivityMatrixResult]]:
        return generate_sensitivity_matrix(
            base_groups=req.baseGroups,
            wells=req.wells,
            x_var=req.xVar,
            x_steps=req.xSteps,
            y_var=req.yVar,
            y_steps=req.ySteps,
        )

    # ALWAYS-LIVE: /api/spatial/* is polled by the app's connection-status check
    # regardless of which economics engine is active.
    app.include_router(create_spatial_router())

    return app


app = create_app()
