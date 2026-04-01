import math
from unittest.mock import AsyncMock, patch

import pytest

from app.services.product_matcher import _calculate_quantity, _select_best_capacity_matches, match_products


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
# Integration-style tests for match_products (with mocked DB)
# ---------------------------------------------------------------------------

def _make_record(data: dict):
    """Simulate an asyncpg Record that supports dict() and key access."""
    class FakeRecord(dict):
        def __getitem__(self, key):
            return super().__getitem__(key)
    return FakeRecord(data)


class TestMatchProducts:
    @pytest.mark.asyncio
    async def test_basic_matching(self):
        mock_rows = [
            _make_record({
                "product_code": "DESK-001",
                "product_role": "primary",
                "capacity": None,
                "quantity_rule": "per_workstation",
            }),
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
                {"space_type": "open_workstation", "count": 30},
            ])

        assert len(result) == 2
        by_code = {r["product_code"]: r for r in result}
        assert by_code["DESK-001"]["quantity"] == 30
        assert by_code["CHAIR-001"]["quantity"] == 30

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
