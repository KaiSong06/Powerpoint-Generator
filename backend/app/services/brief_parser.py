import json
import logging

import anthropic

from ..config import get_settings
from ..schemas.presentation import SpaceType

logger = logging.getLogger(__name__)

# Valid space types for the prompt
_VALID_SPACE_TYPES = [e.value for e in SpaceType]

_SYSTEM_PROMPT = f"""\
You are a structured-data extraction assistant. Your ONLY job is to parse a
natural-language office space breakdown into a JSON array.

Each element in the array must have exactly these keys:
- "space_type": one of {_VALID_SPACE_TYPES}
- "count": a positive integer (number of that space)
- "capacity": a positive integer or null (seats/people per room, if mentioned)

Rules:
- Output ONLY the JSON array, no markdown fences, no explanation.
- If the user mentions "desks" or "workstations", use "open_workstation".
- If the user mentions "offices", infer "private_office" unless they say "executive".
- "Conference rooms" or "meeting rooms" → "conference_room".
- "Huddle rooms" or "small meeting rooms" → "huddle_room".
- "Break rooms" or "kitchens" or "cafes" → "break_room".
- "Phone booths" or "phone rooms" → "phone_booth".
- "Training rooms" or "classrooms" → "training_room".
- "Lobby" or "reception" or "front desk" → "reception".
- "Lounge" or "collaboration area" or "soft seating" → "lounge".
- If capacity is not mentioned for a space, set "capacity" to null.
- If you cannot parse the input at all, return an empty array: []
"""


class BriefParseError(Exception):
    """Raised when the AI cannot parse the brief into valid spaces."""


async def parse_brief(text: str) -> list[dict]:
    """Parse a natural-language space breakdown into structured space data.

    Args:
        text: Free-form description of office spaces.

    Returns:
        List of dicts with keys: space_type, count, capacity.

    Raises:
        BriefParseError: If parsing fails or returns no valid spaces.
    """
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise BriefParseError("Anthropic API key is not configured")

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    try:
        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": text}],
        )
    except anthropic.APIError as e:
        logger.error("Anthropic API error: %s", e)
        raise BriefParseError("AI service is temporarily unavailable") from e

    raw = message.content[0].text.strip()

    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3].strip()

    try:
        spaces = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse AI response as JSON: %s", raw)
        raise BriefParseError(
            "Could not understand the space breakdown. Please rephrase your brief."
        ) from e

    if not isinstance(spaces, list) or len(spaces) == 0:
        raise BriefParseError(
            "No spaces could be identified from your brief. "
            "Please describe the room types and quantities."
        )

    # Validate and clean each space entry
    valid_set = set(_VALID_SPACE_TYPES)
    validated = []
    for space in spaces:
        st = space.get("space_type")
        if st not in valid_set:
            logger.warning("Skipping unknown space_type from AI: %s", st)
            continue

        count = space.get("count", 1)
        if not isinstance(count, int) or count < 1:
            count = 1

        capacity = space.get("capacity")
        if capacity is not None and (not isinstance(capacity, int) or capacity < 1):
            capacity = None

        validated.append({
            "space_type": st,
            "count": count,
            "capacity": capacity,
        })

    if not validated:
        raise BriefParseError(
            "No valid space types could be identified. "
            "Please describe rooms like workstations, offices, conference rooms, etc."
        )

    return validated
