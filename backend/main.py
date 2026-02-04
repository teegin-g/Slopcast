from fastapi import FastAPI
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


def create_app() -> FastAPI:
    app = FastAPI(title="Slopcast Backend", version="0.1.0")

    # Local-dev CORS: Vite defaults to :3000, and users may use localhost or 127.0.0.1.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://127.0.0.1:3000",
            "http://localhost:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health() -> dict:
        return {"ok": True}

    @app.post("/api/economics/calculate", response_model=EconomicsResponse)
    def economics_calculate(req: CalculateEconomicsRequest) -> EconomicsResponse:
        scalars = req.scalars or Scalars()
        return calculate_economics(
            selected_wells=req.wells,
            tc=req.typeCurve,
            capex=req.capex,
            pricing=req.pricing,
            scalars=scalars,
            schedule_override=req.scheduleOverride,
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

    return app


app = create_app()

