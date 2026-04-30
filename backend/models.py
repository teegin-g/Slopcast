from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


WellStatus = Literal["PRODUCING", "DUC", "PERMIT"]
CapexCategory = Literal["DRILLING", "COMPLETION", "FACILITIES", "EQUIPMENT", "OTHER"]
CostBasis = Literal["PER_WELL", "PER_FOOT"]
CutoffKind = Literal["rate", "cum", "time_days", "decline", "default"]
ReserveCategory = Literal["PDP", "PUD", "PROBABLE", "POSSIBLE"]


class WellTrajectoryPoint(BaseModel):
    lat: float
    lng: float
    depthFt: float = Field(default=0.0, description="TVD in feet, 0=surface, positive=deeper")


class WellTrajectory(BaseModel):
    path: list[WellTrajectoryPoint] = Field(
        default_factory=list,
        description="Full survey path from surface to TD, ordered by measured depth",
    )
    surface: WellTrajectoryPoint
    heel: WellTrajectoryPoint
    toe: WellTrajectoryPoint
    mdFt: float | None = None


class Well(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    lateralLength: float = Field(..., ge=0, description="Feet")
    status: WellStatus
    operator: str
    formation: str = ""
    trajectory: WellTrajectory | None = None


class ForecastSegment(BaseModel):
    id: str
    name: str
    method: str = "arps"
    qi: float | None = None
    b: float | None = None
    initialDecline: float | None = None
    cutoffKind: CutoffKind = "default"
    cutoffValue: float | None = None


class TypeCurveParams(BaseModel):
    qi: float = Field(..., ge=0, description="Initial production (bbl/d)")
    b: float = Field(..., ge=0, description="b-factor")
    di: float = Field(..., ge=0, description="Nominal initial decline rate (annual %)")
    terminalDecline: float = Field(..., ge=0, description="Terminal decline (annual %)")
    gorMcfPerBbl: float = Field(0.0, ge=0, description="Gas-Oil Ratio (mcf/bbl)")
    segments: list[ForecastSegment] = Field(default_factory=list)


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
    # Legacy flattened Python-engine fields. Rich callers should use
    # OwnershipAssumptions and OpexAssumptions instead.
    nri: float | None = Field(default=None, ge=0)
    loePerMonth: float | None = Field(default=None, ge=0)


class OpexSegment(BaseModel):
    id: str
    label: str
    startMonth: int = Field(..., ge=1)
    endMonth: int = Field(..., ge=1)
    fixedPerWellPerMonth: float = Field(..., ge=0)
    variableOilPerBbl: float = Field(0.0, ge=0)
    variableGasPerMcf: float = Field(0.0, ge=0)


class OpexAssumptions(BaseModel):
    segments: list[OpexSegment]


class JvAgreementTerms(BaseModel):
    conveyRevenuePctOfBase: float = Field(0.0, ge=0, le=1)
    conveyCostPctOfBase: float = Field(0.0, ge=0, le=1)


class JvAgreement(BaseModel):
    id: str
    name: str
    startMonth: int = Field(1, ge=1)
    prePayout: JvAgreementTerms
    postPayout: JvAgreementTerms


class OwnershipAssumptions(BaseModel):
    baseNri: float = Field(..., ge=0, le=1)
    baseCostInterest: float = Field(..., ge=0, le=1)
    agreements: list[JvAgreement] = Field(default_factory=list)


class TaxAssumptions(BaseModel):
    severanceTaxPct: float = Field(..., ge=0)
    adValoremTaxPct: float = Field(..., ge=0)
    federalTaxRate: float = Field(..., ge=0)
    depletionAllowancePct: float = Field(..., ge=0)
    stateTaxRate: float = Field(..., ge=0)


class DebtAssumptions(BaseModel):
    enabled: bool = False
    revolverSize: float = Field(0.0, ge=0)
    revolverRate: float = Field(0.0, ge=0)
    termLoanAmount: float = Field(0.0, ge=0)
    termLoanRate: float = Field(0.0, ge=0)
    termLoanAmortMonths: int = Field(0, ge=0)
    cashSweepPct: float = Field(0.0, ge=0)


class MonthlyCashFlow(BaseModel):
    month: int = Field(..., ge=1)
    date: str
    oilProduction: float
    gasProduction: float = 0.0
    revenue: float
    capex: float
    opex: float
    netCashFlow: float
    cumulativeCashFlow: float
    severanceTax: float | None = None
    adValoremTax: float | None = None
    incomeTax: float | None = None
    afterTaxCashFlow: float | None = None
    cumulativeAfterTaxCashFlow: float | None = None
    interestExpense: float | None = None
    principalPayment: float | None = None
    leveredCashFlow: float | None = None
    cumulativeLeveredCashFlow: float | None = None
    outstandingDebt: float | None = None


class DealMetrics(BaseModel):
    totalCapex: float
    eur: float
    npv10: float
    irr: float
    payoutMonths: int
    wellCount: int
    afterTaxNpv10: float | None = None
    afterTaxPayoutMonths: int | None = None
    leveredNpv10: float | None = None
    equityIrr: float | None = None
    dscr: float | None = None
    riskedEur: float | None = None
    riskedNpv10: float | None = None


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
    opex: OpexAssumptions | None = None
    ownership: OwnershipAssumptions | None = None
    reserveCategory: ReserveCategory | None = None
    taxAssumptions: TaxAssumptions | None = None
    debtAssumptions: DebtAssumptions | None = None
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
    opex: OpexAssumptions | None = None
    ownership: OwnershipAssumptions | None = None
    scalars: Scalars | None = None
    scheduleOverride: ScheduleParams | None = None
    taxAssumptions: TaxAssumptions | None = None
    debtAssumptions: DebtAssumptions | None = None
    reserveCategory: ReserveCategory | None = None


class AggregateEconomicsRequest(BaseModel):
    groups: list[WellGroup]


class SensitivityMatrixRequest(BaseModel):
    baseGroups: list[WellGroup]
    wells: list[Well]
    xVar: SensitivityVariable
    xSteps: list[float]
    yVar: SensitivityVariable
    ySteps: list[float]
