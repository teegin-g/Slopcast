"""
Setup service — backs the Project Setup / Launchpad surface.

Responsibilities:
  - Publish a curated, typed field catalog drawn from eds.well.tbl_well_summary_all.
  - Resolve distinct values for core fields (basin/state/county/formation/operator/status).
  - Estimate the well count for a basin + filter set.
  - Interpret a natural-language query into structured filter clauses.
  - Offer preset "starting point" projects for a selected basin.

Every operation prefers a live Databricks SQL Warehouse / model-serving endpoint
when credentials are configured, and falls back to deterministic mock data so the
Launchpad is fully functional in local dev. This mirrors spatial_service.py.
"""

from __future__ import annotations

import json
import logging
import os
import re
import urllib.error
import urllib.request
from typing import Any

from .setup_models import (
    CountResponse,
    DataSource,
    FieldStatsResponse,
    FieldValuesResponse,
    FilterClause,
    InterpretResponse,
    PresetProject,
    PresetsResponse,
    SchemaResponse,
    WellSummaryField,
)
from .spatial_service import _get_db_connection  # shared Databricks SQL connection

logger = logging.getLogger(__name__)

_DEFAULT_SUMMARY_TABLE = "eds.well.tbl_well_summary_all"
_DEFAULT_MODEL_ENDPOINT = "databricks-meta-llama-3-3-70b-instruct"
_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
_COUNT_CAP = 4_600_000  # ~ full L48 row count; used as the "everything" ceiling


# ---------------------------------------------------------------------------
# Field catalog — curated subset of the ~165-column well-summary schema.
# ---------------------------------------------------------------------------

_FIELDS: list[WellSummaryField] = [
    # --- Location & hierarchy (core dropdowns first) ---
    WellSummaryField(name="basin", label="Basin", category="Location", data_type="string", core=True,
                     description="Industry-defined geological basin"),
    WellSummaryField(name="state", label="State", category="Location", data_type="string", core=True,
                     description="State of the surface hole"),
    WellSummaryField(name="county", label="County", category="Location", data_type="string", core=True,
                     description="County of the surface hole"),
    WellSummaryField(name="formation", label="Formation", category="Location", data_type="string", core=True,
                     description="Mappable stratigraphic unit"),
    WellSummaryField(name="operator", label="Operator", category="Operator", data_type="string", core=True,
                     description="Current operator name"),
    WellSummaryField(name="well_status", label="Well Status", category="Status", data_type="string", core=True,
                     description="Current lifecycle state (Producing, DUC, Permit, …)"),
    WellSummaryField(name="zone", label="Zone", category="Location", data_type="string",
                     description="Interval within the formation"),
    WellSummaryField(name="play", label="Play", category="Location", data_type="string",
                     description="Hydrocarbon play area"),
    WellSummaryField(name="region", label="Region", category="Location", data_type="string"),
    WellSummaryField(name="district", label="District", category="Location", data_type="string"),
    WellSummaryField(name="asset_team", label="Asset Team", category="Location", data_type="string"),
    # --- Well characteristics ---
    WellSummaryField(name="well_type", label="Well Type", category="Characteristics", data_type="string",
                     description="Exploration, Development, Infill, Delineation"),
    WellSummaryField(name="wellbore_direction", label="Wellbore Direction", category="Characteristics",
                     data_type="string", description="HORIZONTAL, VERTICAL, DIRECTIONAL"),
    WellSummaryField(name="operated_class", label="Operated Class", category="Characteristics", data_type="string",
                     description="OP, NONOP, NOINT"),
    WellSummaryField(name="wi", label="Working Interest", category="Ownership", data_type="numeric", unit="fraction",
                     min=0, max=1),
    WellSummaryField(name="nri", label="Net Revenue Interest", category="Ownership", data_type="numeric",
                     unit="fraction", min=0, max=1),
    # --- Drilling & completion ---
    WellSummaryField(name="lateral_length", label="Lateral Length", category="Completion", data_type="numeric",
                     unit="ft", min=0, max=25000, description="Completed lateral length"),
    WellSummaryField(name="total_depth", label="Total Depth", category="Completion", data_type="numeric", unit="ft",
                     min=0, max=30000),
    WellSummaryField(name="true_vertical_depth", label="True Vertical Depth", category="Completion",
                     data_type="numeric", unit="ft", min=0, max=25000),
    WellSummaryField(name="stage_total", label="Frac Stages", category="Completion", data_type="numeric", unit="stages",
                     min=0, max=120),
    WellSummaryField(name="proppant_total", label="Proppant (total)", category="Completion", data_type="numeric",
                     unit="lbs", min=0, max=50_000_000),
    WellSummaryField(name="proppant_per_ft", label="Proppant / ft", category="Completion", data_type="numeric",
                     unit="lbs/ft", min=0, max=4000),
    WellSummaryField(name="fluid_total", label="Fluid (total)", category="Completion", data_type="numeric", unit="gal",
                     min=0, max=80_000_000),
    WellSummaryField(name="fluid_per_ft", label="Fluid / ft", category="Completion", data_type="numeric",
                     unit="gal/ft", min=0, max=6000),
    # --- Dates ---
    WellSummaryField(name="permit_date", label="Permit Date", category="Dates", data_type="date"),
    WellSummaryField(name="spud_date", label="Spud Date", category="Dates", data_type="date"),
    WellSummaryField(name="completion_date", label="Completion Date", category="Dates", data_type="date"),
    WellSummaryField(name="first_prod_date", label="First Production", category="Dates", data_type="date"),
    WellSummaryField(name="last_prod_date", label="Last Production", category="Dates", data_type="date"),
    WellSummaryField(name="rig_release_date", label="Rig Release", category="Dates", data_type="date"),
    # --- Production (cumulative) ---
    WellSummaryField(name="cum_boe_to_date", label="Cum BOE (life)", category="Production", data_type="numeric",
                     unit="boe", min=0, max=5_000_000),
    WellSummaryField(name="cum_oil_to_date", label="Cum Oil (life)", category="Production", data_type="numeric",
                     unit="bbl", min=0, max=3_000_000),
    WellSummaryField(name="cum_gas_to_date", label="Cum Gas (life)", category="Production", data_type="numeric",
                     unit="mcf", min=0, max=20_000_000),
    WellSummaryField(name="cum_boe_3mo", label="Cum BOE (90d / 3mo)", category="Production", data_type="numeric",
                     unit="boe", min=0, max=600_000),
    WellSummaryField(name="cum_boe_6mo", label="Cum BOE (180d / 6mo)", category="Production", data_type="numeric",
                     unit="boe", min=0, max=900_000),
    WellSummaryField(name="cum_boe_12mo", label="Cum BOE (365d / 12mo)", category="Production", data_type="numeric",
                     unit="boe", min=0, max=1_400_000),
    WellSummaryField(name="cum_boe_24mo", label="Cum BOE (24mo)", category="Production", data_type="numeric",
                     unit="boe", min=0, max=2_000_000),
    WellSummaryField(name="cum_boe_12mo_per_ft", label="Cum BOE/ft (12mo)", category="Production", data_type="numeric",
                     unit="boe/ft", min=0, max=160),
    WellSummaryField(name="peak_boe", label="Peak BOE (month)", category="Production", data_type="numeric", unit="boe",
                     min=0, max=120_000),
    WellSummaryField(name="gor_cum_to_date", label="GOR (life)", category="Production", data_type="numeric",
                     unit="scf/bbl", min=0, max=20000),
    WellSummaryField(name="water_cut_cum_to_date", label="Water Cut (life)", category="Production", data_type="numeric",
                     unit="fraction", min=0, max=1),
    WellSummaryField(name="first_prod_year", label="First Prod. Year", category="Production", data_type="numeric",
                     min=1980, max=2026),
    # --- EUR ---
    WellSummaryField(name="eur_boe", label="EUR BOE", category="EUR", data_type="numeric", unit="boe", min=0,
                     max=4_000_000),
    WellSummaryField(name="eur_oil_bbl", label="EUR Oil", category="EUR", data_type="numeric", unit="bbl", min=0,
                     max=2_500_000),
    WellSummaryField(name="eur_gas_mcf", label="EUR Gas", category="EUR", data_type="numeric", unit="mcf", min=0,
                     max=18_000_000),
    WellSummaryField(name="eur_boe_per_ft", label="EUR BOE / ft", category="EUR", data_type="numeric", unit="boe/ft",
                     min=0, max=320),
    WellSummaryField(name="eur_source", label="EUR Source", category="EUR", data_type="string",
                     description="ENVERUS, NOVI LABS, ARIES EVERGREEN, ARIES PUBLIC"),
    # --- Reservoir ---
    WellSummaryField(name="initial_reservoir_pressure", label="Initial Pressure", category="Reservoir",
                     data_type="numeric", unit="psi", min=0, max=15000),
    WellSummaryField(name="reservoir_temperature", label="Reservoir Temp.", category="Reservoir", data_type="numeric",
                     unit="°F", min=0, max=400),
    WellSummaryField(name="effective_porosity", label="Porosity (P50)", category="Reservoir", data_type="numeric",
                     unit="fraction", min=0, max=0.4),
    WellSummaryField(name="water_saturation", label="Water Saturation", category="Reservoir", data_type="numeric",
                     unit="fraction", min=0, max=1),
    WellSummaryField(name="initial_oil_gravity", label="Oil Gravity", category="Reservoir", data_type="numeric",
                     unit="°API", min=0, max=70),
    # --- Spacing ---
    WellSummaryField(name="env_spacing_status", label="Spacing Status", category="Spacing", data_type="string",
                     description="CO-COMPLETED, CHILD, PARENT, STANDALONE"),
    WellSummaryField(name="env_dist_to_neighbor_same_zone_hz", label="Dist. to Neighbor (HZ)", category="Spacing",
                     data_type="numeric", unit="ft", min=0, max=6000),
]

_FIELD_BY_NAME: dict[str, WellSummaryField] = {f.name: f for f in _FIELDS}

# Category display order.
_CATEGORY_ORDER = [
    "Location", "Operator", "Status", "Characteristics", "Ownership",
    "Completion", "Dates", "Production", "EUR", "Reservoir", "Spacing",
]


# ---------------------------------------------------------------------------
# Mock distinct values (used when Databricks is unavailable).
# ---------------------------------------------------------------------------

_MOCK_BASINS = [
    "PERMIAN", "WILLISTON", "ANADARKO", "POWDER RIVER", "DJ",
    "EAGLE FORD", "BAKKEN", "HAYNESVILLE", "APPALACHIAN", "UINTA",
]

_MOCK_VALUES: dict[str, list[str]] = {
    "basin": _MOCK_BASINS,
    "state": [
        "TEXAS", "NEW MEXICO", "NORTH DAKOTA", "OKLAHOMA", "WYOMING",
        "COLORADO", "MONTANA", "LOUISIANA", "PENNSYLVANIA", "UTAH",
    ],
    "county": [
        "MIDLAND", "MARTIN", "REEVES", "LOVING", "HOWARD", "LEA", "EDDY",
        "MCKENZIE", "WILLIAMS", "DUNN", "WELD", "KARNES", "DEWITT", "CANADIAN",
    ],
    "formation": [
        "WOLFCAMP A", "WOLFCAMP B", "BONE SPRING", "SPRABERRY", "AVALON",
        "BAKKEN", "THREE FORKS", "MERAMEC", "WOODFORD", "NIOBRARA", "CODELL",
    ],
    "operator": [
        "CONTINENTAL RESOURCES", "EXXON XTO", "CHEVRON", "OXY", "DIAMONDBACK",
        "PIONEER", "DEVON", "EOG RESOURCES", "COTERRA", "CONOCOPHILLIPS",
        "MARATHON", "APACHE",
    ],
    "well_status": ["PRODUCING", "DUC", "PERMIT", "INACTIVE", "PLUGGED AND ABANDONED"],
    "operated_class": ["OP", "NONOP", "NOINT"],
    "wellbore_direction": ["HORIZONTAL", "VERTICAL", "DIRECTIONAL"],
    "well_type": ["DEVELOPMENT", "EXPLORATION", "INFILL", "DELINEATION"],
    "eur_source": ["ENVERUS", "NOVI LABS", "ARIES EVERGREEN", "ARIES PUBLIC"],
    "env_spacing_status": ["CO-COMPLETED", "CHILD", "PARENT", "STANDALONE"],
    "zone": ["UPPER", "MIDDLE", "LOWER"],
    "region": ["NORTH", "SOUTH"],
}

# Deterministic base universe per basin (rough industry magnitudes for the demo).
_MOCK_BASIN_BASE: dict[str, int] = {
    "PERMIAN": 612_000,
    "WILLISTON": 184_000,
    "ANADARKO": 158_000,
    "POWDER RIVER": 96_000,
    "DJ": 142_000,
    "EAGLE FORD": 121_000,
    "BAKKEN": 96_500,
    "HAYNESVILLE": 88_000,
    "APPALACHIAN": 203_000,
    "UINTA": 41_000,
}


# ---------------------------------------------------------------------------
# Config helpers
# ---------------------------------------------------------------------------

def _summary_table() -> str:
    return os.getenv("SETUP_WELL_SUMMARY_TABLE", _DEFAULT_SUMMARY_TABLE)


def _validate_table_path(value: str) -> str:
    parts = value.split(".")
    if not 1 <= len(parts) <= 3 or not all(_IDENTIFIER_RE.fullmatch(p) for p in parts):
        raise ValueError(f"Invalid table path: {value!r}")
    return value


def _model_endpoint() -> str | None:
    # An explicit empty value disables the model path; default name is enabled
    # only when host + token are also present (checked at call time).
    value = os.getenv("DATABRICKS_MODEL_ENDPOINT", _DEFAULT_MODEL_ENDPOINT)
    return value or None


def _databricks_host() -> str | None:
    raw = (
        os.getenv("DATABRICKS_SERVER_HOSTNAME")
        or os.getenv("DATABRICKS_HOST")
        or os.getenv("DATABRICKS_WORKSPACE_URL")
    )
    if not raw:
        return None
    return raw.replace("https://", "").replace("http://", "").rstrip("/")


def _databricks_token() -> str | None:
    return os.getenv("DATABRICKS_TOKEN") or os.getenv("DATABRICKS_ACCESS_TOKEN")


# ---------------------------------------------------------------------------
# Safe SQL WHERE builder
# ---------------------------------------------------------------------------

_OP_SQL = {"gt": ">", "gte": ">=", "lt": "<", "lte": "<=", "eq": "="}


def build_where(
    basin: str | None,
    filters: list[FilterClause],
    params: dict[str, Any],
) -> str:
    """
    Build a parametrized WHERE body from a basin + filter clauses.

    Only allow-listed field names (present in the catalog) are accepted; every
    value is bound as a parameter. Returns the clause body WITHOUT the leading
    "WHERE" (empty string when there are no constraints).
    """
    clauses: list[str] = []

    if basin:
        params["p_basin"] = basin.upper()
        clauses.append("UPPER(basin) = %(p_basin)s")

    for index, clause in enumerate(filters):
        field = _FIELD_BY_NAME.get(clause.field)
        if field is None:
            continue  # reject unknown columns outright
        col = field.name  # already identifier-safe (catalog-controlled)

        if clause.kind == "set" and clause.values:
            placeholders: list[str] = []
            for j, value in enumerate(clause.values):
                key = f"p_{index}_{j}"
                params[key] = str(value).upper()
                placeholders.append(f"%({key})s")
            clauses.append(f"UPPER(CAST({col} AS STRING)) IN ({', '.join(placeholders)})")

        elif clause.kind == "numeric" and clause.op:
            if clause.op == "between" and clause.value is not None and clause.value2 is not None:
                lo_key, hi_key = f"p_{index}_lo", f"p_{index}_hi"
                lo, hi = sorted((clause.value, clause.value2))
                params[lo_key], params[hi_key] = lo, hi
                clauses.append(f"{col} BETWEEN %({lo_key})s AND %({hi_key})s")
            elif clause.value is not None and clause.op in _OP_SQL:
                key = f"p_{index}_n"
                params[key] = clause.value
                clauses.append(f"{col} {_OP_SQL[clause.op]} %({key})s")

        elif clause.kind == "date":
            if clause.start:
                key = f"p_{index}_ds"
                params[key] = clause.start
                clauses.append(f"{col} >= %({key})s")
            if clause.end:
                key = f"p_{index}_de"
                params[key] = clause.end
                clauses.append(f"{col} <= %({key})s")

        elif clause.kind == "string" and clause.text:
            if clause.match == "fuzzy":
                key = f"p_{index}_s"
                params[key] = f"%{clause.text.upper()}%"
                clauses.append(f"UPPER(CAST({col} AS STRING)) LIKE %({key})s")
            else:
                key = f"p_{index}_s"
                params[key] = clause.text.upper()
                clauses.append(f"UPPER(CAST({col} AS STRING)) = %({key})s")

    return " AND ".join(clauses)


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

def get_schema() -> SchemaResponse:
    present = [c for c in _CATEGORY_ORDER if any(f.category == c for f in _FIELDS)]
    return SchemaResponse(fields=list(_FIELDS), categories=present, table=_summary_table())


# ---------------------------------------------------------------------------
# Field values (distinct)
# ---------------------------------------------------------------------------

def get_field_values(field: str, limit: int = 400) -> FieldValuesResponse:
    catalog_field = _FIELD_BY_NAME.get(field)
    if catalog_field is None:
        return FieldValuesResponse(field=field, values=[], source="mock")

    conn = _get_db_connection()
    if conn is not None:
        try:
            table = _validate_table_path(_summary_table())
            sql = (
                f"SELECT DISTINCT {catalog_field.name} AS v FROM {table} "
                f"WHERE {catalog_field.name} IS NOT NULL "
                f"ORDER BY v LIMIT %(limit)s"
            )
            with conn.cursor() as cursor:
                cursor.execute(sql, {"limit": limit})
                rows = cursor.fetchall()
            values = [str(r[0]).strip() for r in rows if r[0] is not None and str(r[0]).strip()]
            if values:
                return FieldValuesResponse(field=field, values=values, source="databricks")
        except Exception as exc:  # noqa: BLE001
            logger.warning("Field values query failed for %s, falling back to mock: %s", field, exc)

    return FieldValuesResponse(field=field, values=_MOCK_VALUES.get(field, []), source="mock")


# ---------------------------------------------------------------------------
# Field stats (domain for numeric / date editors)
# ---------------------------------------------------------------------------

# Default mock date domain when no live MIN/MAX is available.
_MOCK_DATE_MIN = "2008-01-01"


def _mock_date_max() -> str:
    from datetime import date

    return date.today().isoformat()


def get_field_stats(field: str, basin: str | None, filters: list[FilterClause]) -> FieldStatsResponse:
    catalog_field = _FIELD_BY_NAME.get(field)
    if catalog_field is None:
        return FieldStatsResponse(field=field, data_type="string", source="mock")

    if catalog_field.data_type not in {"numeric", "date"}:
        return FieldStatsResponse(field=field, data_type=catalog_field.data_type, source="mock")

    conn = _get_db_connection()
    if conn is not None:
        try:
            table = _validate_table_path(_summary_table())
            params: dict[str, Any] = {}
            where = build_where(basin, filters, params)
            sql = f"SELECT MIN({catalog_field.name}) AS lo, MAX({catalog_field.name}) AS hi FROM {table}"
            if where:
                sql += f" WHERE {where}"
            with conn.cursor() as cursor:
                cursor.execute(sql, params)
                row = cursor.fetchone()
            lo, hi = (row[0], row[1]) if row else (None, None)
            if catalog_field.data_type == "date":
                return FieldStatsResponse(
                    field=field,
                    data_type="date",
                    min_date=_iso_date(lo),
                    max_date=_iso_date(hi),
                    source="databricks",
                )
            return FieldStatsResponse(
                field=field,
                data_type="numeric",
                min=float(lo) if lo is not None else None,
                max=float(hi) if hi is not None else None,
                source="databricks",
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Field stats query failed for %s, falling back to mock: %s", field, exc)

    # Mock domain from the catalog (numeric) or a sensible date window.
    if catalog_field.data_type == "date":
        return FieldStatsResponse(
            field=field, data_type="date", min_date=_MOCK_DATE_MIN, max_date=_mock_date_max(), source="mock"
        )
    return FieldStatsResponse(
        field=field, data_type="numeric", min=catalog_field.min, max=catalog_field.max, source="mock"
    )


def _iso_date(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value)
    # Trim a datetime to its date portion.
    return text[:10] if len(text) >= 10 else text


# ---------------------------------------------------------------------------
# Count
# ---------------------------------------------------------------------------

def _selectivity(clause: FilterClause) -> float:
    """Rough fraction of a universe retained by a clause (mock estimator only)."""
    if clause.kind == "set" and clause.values:
        # Each chosen value adds coverage; more values = broader.
        return min(0.92, 0.16 * len(clause.values) + 0.05)
    if clause.kind == "numeric":
        return 0.34 if clause.op == "between" else 0.45
    if clause.kind == "date":
        if clause.start and clause.end:
            return 0.28
        return 0.5
    if clause.kind == "string":
        return 0.12 if clause.match == "strict" else 0.3
    return 1.0


def estimate_count(basin: str | None, filters: list[FilterClause]) -> CountResponse:
    capped = not basin and not filters

    conn = _get_db_connection()
    if conn is not None:
        try:
            table = _validate_table_path(_summary_table())
            params: dict[str, Any] = {}
            where = build_where(basin, filters, params)
            sql = f"SELECT COUNT(*) FROM {table}"
            if where:
                sql += f" WHERE {where}"
            with conn.cursor() as cursor:
                cursor.execute(sql, params)
                row = cursor.fetchone()
            count = int(row[0]) if row and row[0] is not None else 0
            return CountResponse(count=count, estimated=False, capped=capped, source="databricks")
        except Exception as exc:  # noqa: BLE001
            logger.warning("Count query failed, falling back to mock estimate: %s", exc)

    # Mock heuristic estimate.
    if basin:
        base = _MOCK_BASIN_BASE.get(basin.upper(), 120_000)
    else:
        base = _COUNT_CAP
    estimate = float(base)
    for clause in filters:
        estimate *= _selectivity(clause)
    count = max(0, int(round(estimate)))
    return CountResponse(count=count, estimated=True, capped=capped, source="mock")


# ---------------------------------------------------------------------------
# Presets — curated "starting point" projects, count-resolved per basin.
# ---------------------------------------------------------------------------

def _preset_defs(basin: str) -> list[dict[str, Any]]:
    b = basin.upper()
    return [
        {
            "id": f"{b.lower()}-recent-permits",
            "title": "Fresh permits",
            "subtitle": "Permitted in the last 6 months",
            "metric_label": "New permits",
            "accent": "cyan",
            "filters": [
                FilterClause(field="well_status", kind="set", values=["PERMIT"]),
                FilterClause(field="permit_date", kind="date", start=_months_ago_iso(6)),
            ],
        },
        {
            "id": f"{b.lower()}-recent-spuds",
            "title": "Recently spud",
            "subtitle": "Spud in the last 3 months",
            "metric_label": "Wells spud",
            "accent": "warning",
            "filters": [
                FilterClause(field="spud_date", kind="date", start=_months_ago_iso(3)),
            ],
        },
        {
            "id": f"{b.lower()}-top-12mo-boe",
            "title": "Top 12-month BOE",
            "subtitle": "Cum BOE (365d) over 250 MBOE",
            "metric_label": "High-cum wells",
            "accent": "magenta",
            "filters": [
                FilterClause(field="cum_boe_12mo", kind="numeric", op="gte", value=250_000),
            ],
        },
        {
            "id": f"{b.lower()}-modern-completions",
            "title": "Modern completions",
            "subtitle": "Long laterals, first prod since 2022",
            "metric_label": "Recent completions",
            "accent": "lav",
            "filters": [
                FilterClause(field="lateral_length", kind="numeric", op="gte", value=10_000),
                FilterClause(field="first_prod_date", kind="date", start="2022-01-01"),
            ],
        },
    ]


def get_presets(basin: str | None) -> PresetsResponse:
    if not basin:
        return PresetsResponse(presets=[], basin=None, requires_basin=True, source="mock")

    presets: list[PresetProject] = []
    source: DataSource = "mock"
    for d in _preset_defs(basin):
        count_resp = estimate_count(basin, list(d["filters"]))
        if count_resp.source == "databricks":
            source = "databricks"
        presets.append(
            PresetProject(
                id=d["id"],
                title=d["title"],
                subtitle=d["subtitle"],
                basin=basin.upper(),
                metric_label=d["metric_label"],
                accent=d["accent"],
                filters=list(d["filters"]),
                est_count=count_resp.count,
            )
        )
    return PresetsResponse(presets=presets, basin=basin.upper(), requires_basin=True, source=source)


# ---------------------------------------------------------------------------
# Natural-language interpretation
# ---------------------------------------------------------------------------

def interpret_query(query: str, basin: str | None) -> InterpretResponse:
    """Interpret a NL query into filter clauses via Databricks model serving, with
    a deterministic heuristic fallback."""
    model_result = _interpret_via_model(query, basin)
    if model_result is not None:
        return model_result
    return _interpret_heuristic(query, basin)


def _interpret_via_model(query: str, basin: str | None) -> InterpretResponse | None:
    host = _databricks_host()
    token = _databricks_token()
    endpoint = _model_endpoint()
    if not (host and token and endpoint):
        return None

    system = _interpret_system_prompt()
    user = json.dumps({"query": query, "basin": basin})
    payload = {
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.0,
        "max_tokens": 800,
    }

    url = f"https://{host}/serving-endpoints/{endpoint}/invocations"
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:  # noqa: S310
            body = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        logger.warning("Model-serving interpret failed, using heuristic: %s", exc)
        return None

    try:
        content = body["choices"][0]["message"]["content"]
        parsed = _extract_json(content)
        if parsed is None:
            return None
        clauses = _coerce_clauses(parsed.get("filters", []))
        return InterpretResponse(
            filters=clauses,
            basin=(parsed.get("basin") or basin),
            summary=str(parsed.get("summary", "")).strip() or _summarize(clauses),
            confidence=float(parsed.get("confidence", 0.7)),
            source="databricks",
            notes=parsed.get("notes"),
        )
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        logger.warning("Could not parse model interpret response, using heuristic: %s", exc)
        return None


def _interpret_system_prompt() -> str:
    field_lines = "\n".join(
        f"- {f.name} ({f.data_type}{', ' + f.unit if f.unit else ''}): {f.label}"
        for f in _FIELDS
    )
    return (
        "You translate an oil & gas analyst's natural-language request into structured "
        "filters over the well-summary table. Respond with STRICT JSON only, no prose.\n\n"
        "Available fields:\n" + field_lines + "\n\n"
        "Output schema:\n"
        '{ "basin": string|null, "summary": string, "confidence": number(0..1), '
        '"filters": [ { "field": string, "kind": "set"|"numeric"|"date"|"string", '
        '"values"?: string[], "op"?: "gt"|"gte"|"lt"|"lte"|"eq"|"between", '
        '"value"?: number, "value2"?: number, "start"?: "YYYY-MM-DD", "end"?: "YYYY-MM-DD", '
        '"text"?: string, "match"?: "strict"|"fuzzy" } ] }\n'
        "Rules: only use listed field names. Use set for categorical fields "
        "(basin/state/county/formation/operator/well_status). Use numeric with an op for "
        "thresholds. Use date with start/end for time windows; resolve relative phrases "
        "like 'last 6 months' to absolute dates. Keep summary to one short sentence."
    )


def _extract_json(content: str) -> dict[str, Any] | None:
    content = content.strip()
    # Strip ```json fences if present.
    if content.startswith("```"):
        content = re.sub(r"^```[a-zA-Z]*\n?", "", content)
        content = re.sub(r"\n?```$", "", content).strip()
    try:
        return json.loads(content)
    except ValueError:
        start, end = content.find("{"), content.rfind("}")
        if start != -1 and end > start:
            try:
                return json.loads(content[start : end + 1])
            except ValueError:
                return None
    return None


def _coerce_clauses(raw: Any) -> list[FilterClause]:
    clauses: list[FilterClause] = []
    if not isinstance(raw, list):
        return clauses
    for item in raw:
        if not isinstance(item, dict):
            continue
        field = item.get("field")
        kind = item.get("kind")
        if field not in _FIELD_BY_NAME or kind not in {"set", "numeric", "date", "string"}:
            continue
        try:
            clauses.append(FilterClause(**{k: v for k, v in item.items() if k != "id"}))
        except (TypeError, ValueError):
            continue
    return clauses


# --- Heuristic fallback parser ---------------------------------------------

_MONTH_RE = re.compile(r"last\s+(\d{1,2})\s+month", re.IGNORECASE)
_YEAR_SINCE_RE = re.compile(r"(?:since|after|from)\s+(\d{4})", re.IGNORECASE)
# Number + optional magnitude suffix. Alternatives are longest-first so "mmboe"
# wins over "m"; a following "mo"/"month" (e.g. "12mo") is NOT a magnitude and is
# excluded via a negative lookahead on bare "m".
_NUM_RE = r"([\d,]+(?:\.\d+)?)(?!\s*mo)\s*(mmboe|mboe|mm|bcf|k|m(?!o)|b)?"
_NUM_SUFFIX_MULT = {"k": 1_000, "mboe": 1_000, "mm": 1_000_000, "mmboe": 1_000_000, "m": 1_000_000, "b": 1_000_000_000}

# Generic phrases that should yield only when no more-specific family member matched.
_GENERIC_FAMILY = {"cum_boe_to_date": "cum_boe", "eur_boe": "eur"}

_NUMERIC_PHRASES = [
    ("lateral", "lateral_length"),
    ("cum boe 12", "cum_boe_12mo"),
    ("cum boe 6", "cum_boe_6mo"),
    ("cum boe 3", "cum_boe_3mo"),
    ("365", "cum_boe_12mo"),
    ("180", "cum_boe_6mo"),
    ("90", "cum_boe_3mo"),
    ("cum boe", "cum_boe_to_date"),
    ("eur", "eur_boe"),
    ("stage", "stage_total"),
    ("proppant", "proppant_total"),
    ("pressure", "initial_reservoir_pressure"),
]

_GT_WORDS = ("over", "above", "greater than", "more than", "at least", ">", ">=", "exceeding")
_LT_WORDS = ("under", "below", "less than", "fewer than", "at most", "<", "<=")


def _interpret_heuristic(query: str, basin: str | None) -> InterpretResponse:
    text = query.lower()
    clauses: list[FilterClause] = []
    matched = 0

    detected_basin = basin
    for value in _MOCK_VALUES["basin"]:
        if _word_in(value, text):
            detected_basin = value
            matched += 1
            break

    # Categorical set matches (word-boundary, so short tokens like "DUC" don't
    # match inside words such as "producers").
    for field_name in ("state", "county", "formation", "operator", "well_status"):
        hits = [v for v in _MOCK_VALUES.get(field_name, []) if _word_in(v, text)]
        if hits:
            clauses.append(FilterClause(field=field_name, kind="set", values=hits))
            matched += 1

    # Status shorthand.
    for word, status in (("producing", "PRODUCING"), ("duc", "DUC"), ("permit", "PERMIT")):
        if re.search(rf"\b{word}", text) and not any(c.field == "well_status" for c in clauses):
            clauses.append(FilterClause(field="well_status", kind="set", values=[status]))
            matched += 1
            break

    # Date windows.
    month_match = _MONTH_RE.search(text)
    if month_match:
        months = int(month_match.group(1))
        date_field = "spud_date" if "spud" in text else ("permit_date" if "permit" in text else "first_prod_date")
        clauses.append(FilterClause(field=date_field, kind="date", start=_months_ago_iso(months)))
        matched += 1
    year_match = _YEAR_SINCE_RE.search(text)
    if year_match:
        date_field = "spud_date" if "spud" in text else "first_prod_date"
        if not any(c.field == date_field for c in clauses):
            clauses.append(FilterClause(field=date_field, kind="date", start=f"{year_match.group(1)}-01-01"))
            matched += 1

    # Numeric thresholds.
    for phrase, field_name in _NUMERIC_PHRASES:
        if phrase not in text or any(c.field == field_name for c in clauses):
            continue
        # Skip a generic family phrase when a more specific member already matched
        # (e.g. don't add cum_boe_to_date when cum_boe_12mo is present).
        family = _GENERIC_FAMILY.get(field_name)
        if family and any(c.field.startswith(family) for c in clauses):
            continue
        value = _find_number_near(text, phrase)
        if value is not None:
            op = "lte" if any(w in text for w in _LT_WORDS) else "gte"
            clauses.append(FilterClause(field=field_name, kind="numeric", op=op, value=value))
            matched += 1

    confidence = 0.0 if not clauses else min(0.85, 0.35 + 0.12 * matched)
    return InterpretResponse(
        filters=clauses,
        basin=detected_basin,
        summary=_summarize(clauses) if clauses else "Couldn't infer filters — try naming a basin, formation, or threshold.",
        confidence=confidence,
        source="mock",
        notes=None if clauses else "no_match",
    )


def _word_in(value: str, text: str) -> bool:
    """Whole-word (boundary) containment check, case-insensitive."""
    return re.search(rf"\b{re.escape(value.lower())}\b", text) is not None


def _find_number_near(text: str, phrase: str) -> float | None:
    idx = text.find(phrase)
    if idx == -1:
        return None
    # Search AFTER the phrase so e.g. the "12" in "cum boe 12mo" isn't mistaken
    # for the threshold value.
    window = text[idx + len(phrase) : idx + len(phrase) + 48]
    match = re.search(_NUM_RE, window)
    if not match:
        return None
    raw = match.group(1).replace(",", "")
    try:
        value = float(raw)
    except ValueError:
        return None
    suffix = (match.group(2) or "").lower()
    return value * _NUM_SUFFIX_MULT.get(suffix, 1)


def _summarize(clauses: list[FilterClause]) -> str:
    parts: list[str] = []
    for clause in clauses:
        field = _FIELD_BY_NAME.get(clause.field)
        label = field.label if field else clause.field
        if clause.kind == "set" and clause.values:
            parts.append(f"{label} in {', '.join(clause.values[:3])}{'…' if len(clause.values) > 3 else ''}")
        elif clause.kind == "numeric" and clause.op:
            sym = {"gt": ">", "gte": "≥", "lt": "<", "lte": "≤", "eq": "=", "between": "between"}.get(clause.op, clause.op)
            if clause.op == "between":
                parts.append(f"{label} {clause.value:g}–{clause.value2:g}")
            elif clause.value is not None:
                parts.append(f"{label} {sym} {clause.value:g}")
        elif clause.kind == "date":
            if clause.start and clause.end:
                parts.append(f"{label} {clause.start} → {clause.end}")
            elif clause.start:
                parts.append(f"{label} since {clause.start}")
            elif clause.end:
                parts.append(f"{label} before {clause.end}")
        elif clause.kind == "string" and clause.text:
            parts.append(f"{label} {'~' if clause.match == 'fuzzy' else '='} “{clause.text}”")
    return "; ".join(parts)


# ---------------------------------------------------------------------------
# Small date helper (no external deps)
# ---------------------------------------------------------------------------

def _months_ago_iso(months: int) -> str:
    from datetime import date

    today = date.today()
    total = (today.year * 12 + (today.month - 1)) - months
    year, month = divmod(total, 12)
    month += 1
    day = min(today.day, 28)
    return f"{year:04d}-{month:02d}-{day:02d}"
