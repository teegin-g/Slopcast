"""
Pydantic models for the Project Setup / Launchpad surface.

These mirror `src/types/setup.ts` on the frontend. The Launchpad lets an analyst
narrow the ~4.6M-well `eds.well.tbl_well_summary_all` universe into a working set
before entering the Slopcast workspace.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

# A FieldDataType drives which editor the UI shows for a column.
FieldDataType = Literal["string", "numeric", "date", "boolean"]

# How a clause narrows the universe.
FilterKind = Literal["set", "numeric", "date", "string"]

# Numeric comparison operators.
NumericOp = Literal["gt", "gte", "lt", "lte", "eq", "between"]

# String match strictness (Excel-like).
MatchMode = Literal["strict", "fuzzy"]

# Where a response was sourced from.
DataSource = Literal["databricks", "mock"]


class WellSummaryField(BaseModel):
    """One queryable column from the well-summary schema."""

    name: str = Field(..., description="Physical column name, e.g. cum_boe_12mo")
    label: str = Field(..., description="Human label, e.g. Cum BOE (12mo)")
    category: str = Field(..., description="Grouping, e.g. Production")
    data_type: FieldDataType
    description: str = ""
    unit: str | None = None
    # Core fields get a prominent searchable dropdown (state/county/formation/operator/basin/status).
    core: bool = False
    # Static hint for numeric/date editors (min/max) when live stats are unavailable.
    min: float | None = None
    max: float | None = None


class FilterClause(BaseModel):
    """A single narrowing clause. Shape depends on `kind`."""

    id: str | None = None
    field: str
    kind: FilterKind
    # kind == "set"
    values: list[str] | None = None
    # kind == "numeric"
    op: NumericOp | None = None
    value: float | None = None
    value2: float | None = None
    # kind == "date" (ISO yyyy-mm-dd strings)
    start: str | None = None
    end: str | None = None
    # kind == "string"
    text: str | None = None
    match: MatchMode | None = None


class SchemaResponse(BaseModel):
    fields: list[WellSummaryField]
    categories: list[str]
    table: str


class FieldValuesResponse(BaseModel):
    field: str
    values: list[str]
    source: DataSource


class FieldStatsRequest(BaseModel):
    field: str
    basin: str | None = None
    filters: list[FilterClause] = Field(default_factory=list)


class FieldStatsResponse(BaseModel):
    field: str
    data_type: FieldDataType
    # Numeric domain (for sliders / numeric editors).
    min: float | None = None
    max: float | None = None
    # Date domain (ISO yyyy-mm-dd) — drives the date-range slider extent.
    min_date: str | None = None
    max_date: str | None = None
    source: DataSource


class CountRequest(BaseModel):
    basin: str | None = None
    filters: list[FilterClause] = Field(default_factory=list)


class CountResponse(BaseModel):
    count: int
    estimated: bool = Field(..., description="True when the count is a heuristic, not a live COUNT(*)")
    capped: bool = Field(False, description="True when no basin/filters constrain the universe")
    source: DataSource


class InterpretRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=600)
    basin: str | None = None


class InterpretResponse(BaseModel):
    filters: list[FilterClause] = Field(default_factory=list)
    basin: str | None = None
    summary: str = ""
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    source: DataSource
    notes: str | None = None


class PresetProject(BaseModel):
    id: str
    title: str
    subtitle: str
    basin: str
    metric_label: str
    accent: Literal["cyan", "magenta", "lav", "warning", "success"] = "cyan"
    filters: list[FilterClause] = Field(default_factory=list)
    est_count: int | None = None


class PresetsResponse(BaseModel):
    presets: list[PresetProject]
    basin: str | None = None
    requires_basin: bool = True
    source: DataSource
