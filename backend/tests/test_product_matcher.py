import math
from unittest.mock import AsyncMock, patch

import pytest

from app.services.product_matcher import (
    _calculate_quantity,
    _select_best_capacity_matches,
    _trim_to_budget,
    match_products,
)


# ---------------------------------------------------------------------------
# Unit tests for _calculate_quantity
# ---------------------------------------------------------------------------

class TestCalculateQuantity:
    def test_per_workstation(self):
        assert _calculate_quantity("per_workstation", count=30, requested_capacity=None, product_capacity=None) == 30

    def test_per_room(self):
        assert _calculate_quantity("per_room", count=4, requested_capacity=None, product_capacity=None) == 4

    def test_per_floor(self):
        assert _calculate_quantity("per_floor", count=10, requested_capacity=None, product_capacity=None) == 1

    def test_per_capacity_exact(self):
        # 2 rooms, 8 seats requested, product has 8 capacity -> 2 * 1 = 2
        assert _calculate_quantity("per_capacity", count=2, requested_capacity=8, product_capacity=8) == 2

    def test_per_capacity_ceiling(self):
        # 2 rooms, 10 seats requested, product has 8 capacity -> 2 * ceil(10/8) = 2 * 2 = 4
        assert _calculate_quantity("per_capacity", count=2, requested_capacity=10, product_capacity=8) == 4

    def test_per_capacity_missing_capacity_falls_back(self):
        # No capacity info -> falls back to per_room behavior
        assert _calculate_quantity("per_capacity", count=3, requested_capacity=None, product_capacity=None) == 3

    def test_per_capacity_zero_product_capacity_falls_back(self):
        assert _calculate_quantity("per_capacity", count=3, requested_capacity=8, product_capacity=0) == 3

    def test_unknown_rule_falls_back(self):
        assert _calculate_quantity("unknown", count=5, requested_capacity=None, product_capacity=None) == 5


# ---------------------------------------------------------------------------
# Unit tests for _select_best_capacity_matches
# ---------------------------------------------------------------------------

class TestSelectBestCapacityMatches:
    def test_no_capacity_returns_all(self):
        rows = [
            {"product_code": "A", "product_role": "primary", "capacity": 4, "quantity_rule": "per_room"},
            {"product_code": "B", "product_role": "primary", "capacity": 8, "quantity_rule": "per_room"},
        ]
        result = _select_best_capacity_matches(rows, requested_capacity=None)
        assert len(result) == 2

    def test_picks_closest_gte_capacity(self):
        rows = [
            {"product_code": "T4", "product_role": "primary", "capacity": 4, "quantity_rule": "per_capacity"},
            {"product_code": "T8", "product_role": "primary", "capacity": 8, "quantity_rule": "per_capacity"},
            {"product_code": "T12", "product_role": "primary", "capacity": 12, "quantity_rule": "per_capacity"},
        ]
        result = _select_best_capacity_matches(rows, requested_capacity=6)
        assert len(result) == 1
        assert result[0]["product_code"] == "T8"

    def test_falls_back_to_largest_if_none_gte(self):
        rows = [
            {"product_code": "T4", "product_role": "primary", "capacity": 4, "quantity_rule": "per_capacity"},
            {"product_code": "T6", "product_role": "primary", "capacity": 6, "quantity_rule": "per_capacity"},
        ]
        result = _select_best_capacity_matches(rows, requested_capacity=10)
        assert len(result) == 1
        assert result[0]["product_code"] == "T6"

    def test_products_without_capacity_always_included(self):
        rows = [
            {"product_code": "ACC", "product_role": "accessory", "capacity": None, "quantity_rule": "per_room"},
            {"product_code": "T8", "product_role": "primary", "capacity": 8, "quantity_rule": "per_capacity"},
        ]
        result = _select_best_capacity_matches(rows, requested_capacity=6)
        codes = {r["product_code"] for r in result}
        assert "ACC" in codes
        assert "T8" in codes

    def test_different_role_groups_get_separate_picks(self):
        rows = [
            {"product_code": "P4", "product_role": "primary", "capacity": 4, "quantity_rule": "per_capacity"},
            {"product_code": "P8", "product_role": "primary", "capacity": 8, "quantity_rule": "per_capacity"},
            {"product_code": "S4", "product_role": "secondary", "capacity": 4, "quantity_rule": "per_capacity"},
            {"product_code": "S8", "product_role": "secondary", "capacity": 8, "quantity_rule": "per_capacity"},
        ]
        result = _select_best_capacity_matches(rows, requested_capacity=6)
        codes = {r["product_code"] for r in result}
        assert codes == {"P8", "S8"}


# ---------------------------------------------------------------------------
# Unit tests for _trim_to_budget
# ---------------------------------------------------------------------------

class TestTrimToBudget:
    def test_under_budget_keeps_all(self):
        selections = [
            {"product_code": "A", "quantity": 1, "unit_price": 100, "product_role": "primary"},
            {"product_code": "B", "quantity": 1, "unit_price": 50, "product_role": "accessory"},
        ]
        result = _trim_to_budget(selections, budget=200)
        assert len(result) == 2

    def test_removes_accessories_first(self):
        selections = [
            {"product_code": "A", "quantity": 1, "unit_price": 100, "product_role": "primary"},
            {"product_code": "B", "quantity": 1, "unit_price": 80, "product_role": "secondary"},
            {"product_code": "C", "quantity": 1, "unit_price": 50, "product_role": "accessory"},
        ]
        # Total = 230, budget = 190 -> remove accessory (50) -> 180 <= 190
        result = _trim_to_budget(selections, budget=190)
        codes = {r["product_code"] for r in result}
        assert "C" not in codes
        assert "A" in codes
        assert "B" in codes

    def test_removes_secondary_before_primary(self):
        selections = [
            {"product_code": "A", "quantity": 1, "unit_price": 100, "product_role": "primary"},
            {"product_code": "B", "quantity": 1, "unit_price": 80, "product_role": "secondary"},
        ]
        # Total = 180, budget = 110 -> remove secondary -> 100 <= 110
        result = _trim_to_budget(selections, budget=110)
        assert len(result) == 1
        assert result[0]["product_code"] == "A"

    def test_removes_most_expensive_within_same_priority(self):
        selections = [
            {"product_code": "A", "quantity": 1, "unit_price": 100, "product_role": "primary"},
            {"product_code": "B", "quantity": 10, "unit_price": 20, "product_role": "accessory"},  # line cost 200
            {"product_code": "C", "quantity": 1, "unit_price": 30, "product_role": "accessory"},   # line cost 30
        ]
        # Total = 330, budget = 140 -> remove B (accessory, 200) first -> 130 <= 140
        result = _trim_to_budget(selections, budget=140)
        codes = {r["product_code"] for r in result}
        assert "B" not in codes
        assert "A" in codes
        assert "C" in codes

    def test_budget_too_low_returns_empty(self):
        selections = [
            {"product_code": "A", "quantity": 1, "unit_price": 100, "product_role": "primary"},
        ]
        result = _trim_to_budget(selections, budget=50)
        assert result == []


# ---------------------------------------------------------------------------
# Integration-style tests for match_products (with mocked DB)
# ---------------------------------------------------------------------------

def _make_record(data: dict):
    """Simulate an asyncpg Record that supports dict() and key access."""
    defaults = {"price": 100, "markup_percent": 0}
    defaults.update(data)
    class FakeRecord(dict):
        def __getitem__(self, key):
            return super().__getitem__(key)
    return FakeRecord(defaults)


class TestMatchProducts:
    @pytest.mark.asyncio
    async def test_basic_matching(self):
        mock_rows = [
            _make_record({
                "product_code": "DESK-001",
                "product_role": "primary",
                "capacity": None,
                "quantity_rule": "per_workstation",
                "price": 500,
                "markup_percent": 0,
            }),
            _make_record({
                "product_code": "CHAIR-001",
                "product_role": "secondary",
                "capacity": None,
                "quantity_rule": "per_workstation",
                "price": 200,
                "markup_percent": 0,
            }),
        ]

        with patch("app.services.product_matcher.fetch_all", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = mock_rows
            result = await match_products([
                {"space_type": "open_workstation", "count": 30},
            ])

        assert len(result) == 2
        by_code = {r["product_code"]: r for r in result}
        assert by_code["DESK-001"]["quantity"] == 30
        assert by_code["CHAIR-001"]["quantity"] == 30
        # Internal fields should be stripped
        assert "unit_price" not in by_code["DESK-001"]
        assert "product_role" not in by_code["DESK-001"]

    @pytest.mark.asyncio
    async def test_per_capacity_rule(self):
        mock_rows = [
            _make_record({
                "product_code": "TABLE-8",
                "product_role": "primary",
                "capacity": 8,
                "quantity_rule": "per_capacity",
            }),
        ]

        with patch("app.services.product_matcher.fetch_all", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = mock_rows
            result = await match_products([
                {"space_type": "conference_room", "count": 2, "capacity": 10},
            ])

        assert len(result) == 1
        # 2 rooms * ceil(10/8) = 2 * 2 = 4
        assert result[0]["quantity"] == 4

    @pytest.mark.asyncio
    async def test_per_floor_rule(self):
        mock_rows = [
            _make_record({
                "product_code": "RECEPTION-001",
                "product_role": "primary",
                "capacity": None,
                "quantity_rule": "per_floor",
            }),
        ]

        with patch("app.services.product_matcher.fetch_all", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = mock_rows
            result = await match_products([
                {"space_type": "reception", "count": 3},
            ])

        assert len(result) == 1
        assert result[0]["quantity"] == 1

    @pytest.mark.asyncio
    async def test_no_products_match(self):
        with patch("app.services.product_matcher.fetch_all", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = []
            result = await match_products([
                {"space_type": "unknown_space", "count": 1},
            ])

        assert result == []

    @pytest.mark.asyncio
    async def test_quantities_aggregate_across_spaces(self):
        """Same product matched by multiple space types should aggregate quantity."""
        mock_rows = [
            _make_record({
                "product_code": "CHAIR-001",
                "product_role": "secondary",
                "capacity": None,
                "quantity_rule": "per_workstation",
            }),
        ]

        with patch("app.services.product_matcher.fetch_all", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = mock_rows
            result = await match_products([
                {"space_type": "open_workstation", "count": 20},
                {"space_type": "private_office", "count": 5},
            ])

        assert len(result) == 1
        assert result[0]["quantity"] == 25  # 20 + 5

    @pytest.mark.asyncio
    async def test_budget_none_returns_all(self):
        mock_rows = [
            _make_record({
                "product_code": "DESK-001",
                "product_role": "primary",
                "capacity": None,
                "quantity_rule": "per_workstation",
                "price": 500,
                "markup_percent": 0,
            }),
            _make_record({
                "product_code": "ACC-001",
                "product_role": "accessory",
                "capacity": None,
                "quantity_rule": "per_workstation",
                "price": 50,
                "markup_percent": 0,
            }),
        ]

        with patch("app.services.product_matcher.fetch_all", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = mock_rows
            result = await match_products(
                [{"space_type": "open_workstation", "count": 10}],
                budget=None,
            )

        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_budget_trims_low_priority_first(self):
        mock_rows = [
            _make_record({
                "product_code": "DESK-001",
                "product_role": "primary",
                "capacity": None,
                "quantity_rule": "per_workstation",
                "price": 500,
                "markup_percent": 0,
            }),
            _make_record({
                "product_code": "ACC-001",
                "product_role": "accessory",
                "capacity": None,
                "quantity_rule": "per_workstation",
                "price": 50,
                "markup_percent": 0,
            }),
        ]

        with patch("app.services.product_matcher.fetch_all", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = mock_rows
            # 10 desks @ $500 = $5000, 10 accessories @ $50 = $500, total = $5500
            # Budget $5100 -> trim accessories ($500) -> $5000 <= $5100
            result = await match_products(
                [{"space_type": "open_workstation", "count": 10}],
                budget=5100,
            )

        assert len(result) == 1
        assert result[0]["product_code"] == "DESK-001"

    @pytest.mark.asyncio
    async def test_budget_high_enough_keeps_all(self):
        mock_rows = [
            _make_record({
                "product_code": "DESK-001",
                "product_role": "primary",
                "capacity": None,
                "quantity_rule": "per_workstation",
                "price": 500,
                "markup_percent": 0,
            }),
            _make_record({
                "product_code": "ACC-001",
                "product_role": "accessory",
                "capacity": None,
                "quantity_rule": "per_workstation",
                "price": 50,
                "markup_percent": 0,
            }),
        ]

        with patch("app.services.product_matcher.fetch_all", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = mock_rows
            result = await match_products(
                [{"space_type": "open_workstation", "count": 10}],
                budget=100000,
            )

        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_budget_with_markup(self):
        mock_rows = [
            _make_record({
                "product_code": "DESK-001",
                "product_role": "primary",
                "capacity": None,
                "quantity_rule": "per_room",
                "price": 100,
                "markup_percent": 50,  # effective price = $150
            }),
        ]

        with patch("app.services.product_matcher.fetch_all", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = mock_rows
            # 2 rooms * $150 = $300, budget $200 -> trimmed
            result = await match_products(
                [{"space_type": "private_office", "count": 2}],
                budget=200,
            )

        assert result == []
