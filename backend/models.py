from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


WellStatus = Literal["PRODUCING", "DUC", "PERMIT"]
CapexCategory = Literal["DRILLING", "COMPLETION", "FACILITIES", "EQUIPMENT", "OTHER"]
CostBasis = Literal["PER_WELL", "PER_FOOT"]


class Well(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    lateralLength: float = Field(..., ge=0, description="Feet")
    status: WellStatus
    operator: str


class TypeCurveParams(BaseModel):
    qi: float = Field(..., ge=0, description="Initial production (bbl/d)")
    b: float = Field(..., ge=0, description="b-factor")
    di: float = Field(..., ge=0, description="Nominal initial decline rate (annual %)")
    terminalDecline: float = Field(..., ge=0, description="Terminal decline (annual %)")


class CapexItem(BaseModel):
    id: str
    name: str
    category: CapexCategory
    value: float
    basis: CostBasis
    offsetDays: float = Field(..., description="Days from rig start")


class CapexAssumptions(BaseModel):
    rigCount: float = Field(..., ge=0, description="Legacy/default for groups")
    drillDurationDays: float = Field(..., ge=0)
    stimDurationDays: float = Field(..., ge=0)
    rigStartDate: str = Field(..., description="ISO date string")
    items: list[CapexItem]


class PricingAssumptions(BaseModel):
    oilPrice: float
    gasPrice: float
    oilDifferential: float
    gasDifferential: float
    nri: float = Field(..., ge=0)
    loePerMonth: float = Field(..., ge=0)


class MonthlyCashFlow(BaseModel):
    month: int = Field(..., ge=1)
    date: str
    oilProduction: float
    revenue: float
    capex: float
    opex: float
    netCashFlow: float
    cumulativeCashFlow: float


class DealMetrics(BaseModel):
    totalCapex: float
    eur: float
    npv10: float
    irr: float
    payoutMonths: int
    wellCount: int


class ScheduleParams(BaseModel):
    annualRigs: list[float] = Field(..., description="Rig counts by year; index 0 = year 1")
    drillDurationDays: float = Field(..., ge=0)
    stimDurationDays: float = Field(..., ge=0)
    rigStartDate: str


# Optional (not part of assigned todos, but mirrors types.ts and is useful for later endpoints)
class WellGroup(BaseModel):
    id: str
    name: str
    color: str
    wellIds: list[str]
    typeCurve: TypeCurveParams
    capex: CapexAssumptions
    pricing: PricingAssumptions
    metrics: DealMetrics | None = None
    flow: list[MonthlyCashFlow] | None = None

    @field_validator("wellIds", mode="before")
    @classmethod
    def _coerce_well_ids(cls, v):
        # TS uses Set<string>; JSON typically provides list[str].
        if v is None:
            return []
        if isinstance(v, set):
            return list(v)
        return v


class Scenario(BaseModel):
    id: str
    name: str
    color: str
    isBaseCase: bool
    pricing: PricingAssumptions
    schedule: ScheduleParams
    capexScalar: float = Field(..., ge=0)
    productionScalar: float = Field(..., ge=0)


SensitivityVariable = Literal["OIL_PRICE", "CAPEX_SCALAR", "EUR_SCALAR", "RIG_COUNT"]


class SensitivityMatrixResult(BaseModel):
    xValue: float
    yValue: float
    npv: float


class Scalars(BaseModel):
    capex: float = Field(1.0, ge=0)
    production: float = Field(1.0, ge=0)


class EconomicsResponse(BaseModel):
    flow: list[MonthlyCashFlow]
    metrics: DealMetrics


class CalculateEconomicsRequest(BaseModel):
    wells: list[Well]
    typeCurve: TypeCurveParams
    capex: CapexAssumptions
    pricing: PricingAssumptions
    scalars: Scalars | None = None
    scheduleOverride: ScheduleParams | None = None


class AggregateEconomicsRequest(BaseModel):
    groups: list[WellGroup]


class SensitivityMatrixRequest(BaseModel):
    baseGroups: list[WellGroup]
    wells: list[Well]
    xVar: SensitivityVariable
    xSteps: list[float]
    yVar: SensitivityVariable
    ySteps: list[float]

