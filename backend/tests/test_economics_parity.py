import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.economics import calculate_economics
from backend.main import create_app
from backend.models import CalculateEconomicsRequest


FIXTURE_PATH = Path(__file__).resolve().parents[2] / "fixtures" / "economics" / "dual-parity-rich.json"


def assert_close(actual: float | None, expected: float | None, rel: float = 1e-8) -> None:
    assert actual is not None
    assert expected is not None
    assert actual == pytest.approx(expected, rel=rel)


def test_python_engine_matches_shared_rich_parity_fixture():
    fixture = json.loads(FIXTURE_PATH.read_text())
    request = CalculateEconomicsRequest(**fixture["input"])

    result = calculate_economics(
        request.wells,
        request.typeCurve,
        request.capex,
        request.pricing,
        request.opex,
        request.ownership,
        request.scalars,
        request.scheduleOverride,
        request.taxAssumptions,
        request.debtAssumptions,
        request.reserveCategory,
    )

    expected_metrics = fixture["expected"]["metrics"]
    for key in (
        "totalCapex",
        "eur",
        "npv10",
        "payoutMonths",
        "wellCount",
        "afterTaxNpv10",
        "afterTaxPayoutMonths",
        "leveredNpv10",
        "dscr",
        "riskedEur",
        "riskedNpv10",
    ):
        assert_close(getattr(result.metrics, key), expected_metrics[key])

    for expected_row, actual_row in zip(fixture["expected"]["first12MonthlyFlow"], result.flow[:12], strict=True):
        assert actual_row.month == expected_row["month"]
        for key in (
            "oilProduction",
            "gasProduction",
            "revenue",
            "capex",
            "opex",
            "netCashFlow",
            "afterTaxCashFlow",
            "leveredCashFlow",
            "outstandingDebt",
        ):
            assert_close(getattr(actual_row, key), expected_row[key])


def test_calculate_endpoint_accepts_shared_rich_input_shape():
    fixture = json.loads(FIXTURE_PATH.read_text())
    client = TestClient(create_app())

    response = client.post("/api/economics/calculate", json=fixture["input"])

    assert response.status_code == 200
    body = response.json()
    assert_close(body["metrics"]["npv10"], fixture["expected"]["metrics"]["npv10"])
    assert_close(body["metrics"]["riskedNpv10"], fixture["expected"]["metrics"]["riskedNpv10"])
    assert_close(body["flow"][1]["gasProduction"], fixture["expected"]["first12MonthlyFlow"][1]["gasProduction"])
