import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.schemas.presentation import SpaceType
from app.services.space_parser import parse_space_brief


@pytest.fixture(autouse=True)
def _mock_settings():
    """Prevent Settings from requiring real env vars during tests."""
    fake = MagicMock()
    fake.anthropic_api_key = "test-key"
    with patch("app.services.space_parser.get_settings", return_value=fake):
        yield


class TestParseSpaceBrief:
    @pytest.mark.asyncio
    async def test_basic_parsing(self):
        llm_output = json.dumps([
            {"space_type": "open_workstation", "count": 30, "capacity": None},
            {"space_type": "private_office", "count": 4, "capacity": None},
            {"space_type": "conference_room", "count": 2, "capacity": 16},
        ])

        with patch("app.services.space_parser._call_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = llm_output
            result = await parse_space_brief("30 open workstations, 4 offices, 2 large conference rooms")

        assert len(result) == 3
        assert result[0].space_type == SpaceType.open_workstation
        assert result[0].count == 30
        assert result[1].space_type == SpaceType.private_office
        assert result[2].capacity == 16

    @pytest.mark.asyncio
    async def test_strips_unrecognized_space_types(self):
        llm_output = json.dumps([
            {"space_type": "open_workstation", "count": 10, "capacity": None},
            {"space_type": "meditation_room", "count": 1, "capacity": None},
        ])

        with patch("app.services.space_parser._call_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = llm_output
            result = await parse_space_brief("10 desks and a meditation room")

        assert len(result) == 1
        assert result[0].space_type == SpaceType.open_workstation

    @pytest.mark.asyncio
    async def test_invalid_json_retries_then_succeeds(self):
        valid_output = json.dumps([
            {"space_type": "reception", "count": 1, "capacity": None},
        ])

        call_count = 0

        async def mock_call(api_key, brief):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return "not valid json {"
            return valid_output

        with patch("app.services.space_parser._call_llm", side_effect=mock_call):
            result = await parse_space_brief("1 reception")

        assert len(result) == 1
        assert call_count == 2

    @pytest.mark.asyncio
    async def test_invalid_json_both_attempts_raises(self):
        async def mock_call(api_key, brief):
            return "not json"

        with patch("app.services.space_parser._call_llm", side_effect=mock_call):
            with pytest.raises(ValueError, match="invalid JSON"):
                await parse_space_brief("gibberish")

    @pytest.mark.asyncio
    async def test_empty_result_raises(self):
        llm_output = json.dumps([])

        with patch("app.services.space_parser._call_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = llm_output
            with pytest.raises(ValueError, match="empty or non-array"):
                await parse_space_brief("nothing useful")

    @pytest.mark.asyncio
    async def test_all_unrecognized_types_raises(self):
        llm_output = json.dumps([
            {"space_type": "yoga_room", "count": 1, "capacity": None},
        ])

        with patch("app.services.space_parser._call_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = llm_output
            with pytest.raises(ValueError, match="no valid space types"):
                await parse_space_brief("a yoga room")

    @pytest.mark.asyncio
    async def test_api_error_raises_runtime_error(self):
        with patch("app.services.space_parser._call_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.side_effect = RuntimeError("Anthropic API returned status 500")
            with pytest.raises(RuntimeError):
                await parse_space_brief("anything")
