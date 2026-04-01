import json
import logging

import httpx

from ..config import get_settings
from ..schemas.presentation import SpaceRequest, SpaceType

logger = logging.getLogger(__name__)

VALID_SPACE_TYPES = [e.value for e in SpaceType]

SYSTEM_PROMPT = f"""\
You are a structured-data extraction assistant. Your job is to parse a natural language \
office space description into a JSON array of space requests.

Each element must have these fields:
- "space_type": one of {VALID_SPACE_TYPES}
- "count": integer >= 1 (number of that space)
- "capacity": integer >= 1 or null (seating capacity per room)

Rules for inferring capacity:
- "large conference room" → capacity 16–20 (use 16)
- "medium conference room" → capacity 10–12 (use 10)
- "small conference room" → capacity 6
- "huddle room" → capacity 4 (unless specified)
- "training room" → capacity 20 (unless specified)
- "executive office" → capacity null (it's a single occupant)
- "private office" → capacity null
- "phone booth" → capacity null
- "open workstation" / "open desk" → capacity null (count = number of workstations)
- If a conference room is mentioned with no size qualifier, default capacity to 8
- "reception", "lounge", "break room" → capacity null

Output ONLY a valid JSON array. No markdown fences, no explanation, no preamble.

Examples:

Input: "We need 30 open workstations, 4 private offices, and 2 large conference rooms"
Output: [{{"space_type":"open_workstation","count":30,"capacity":null}},{{"space_type":"private_office","count":4,"capacity":null}},{{"space_type":"conference_room","count":2,"capacity":16}}]

Input: "5 huddle rooms, 1 reception area, 10 phone booths, and a training room for 30 people"
Output: [{{"space_type":"huddle_room","count":5,"capacity":4}},{{"space_type":"reception","count":1,"capacity":null}},{{"space_type":"phone_booth","count":10,"capacity":null}},{{"space_type":"training_room","count":1,"capacity":30}}]

Input: "2 executive offices, 15 open desks, 3 conference rooms (8 seats each), 1 break room, and a lounge"
Output: [{{"space_type":"executive_office","count":2,"capacity":null}},{{"space_type":"open_workstation","count":15,"capacity":null}},{{"space_type":"conference_room","count":3,"capacity":8}},{{"space_type":"break_room","count":1,"capacity":null}},{{"space_type":"lounge","count":1,"capacity":null}}]
"""


async def parse_space_brief(brief: str) -> list[SpaceRequest]:
    """Parse a natural language space description into structured SpaceRequest objects.

    Calls the Google Gemini API to extract structured data from free text,
    validates the response, and returns a list of SpaceRequest objects.
    """
    settings = get_settings()

    raw_json = await _call_llm(settings.gemini_api_key, brief)

    # Validate and parse
    try:
        parsed = json.loads(raw_json)
    except json.JSONDecodeError:
        logger.warning("LLM returned invalid JSON on first attempt, retrying")
        raw_json = await _call_llm(settings.gemini_api_key, brief)
        try:
            parsed = json.loads(raw_json)
        except json.JSONDecodeError:
            raise ValueError("Failed to parse space brief: LLM returned invalid JSON after retry")

    if not isinstance(parsed, list) or len(parsed) == 0:
        raise ValueError("Failed to parse space brief: LLM returned empty or non-array response")

    # Validate each item and filter out unrecognized space types
    spaces: list[SpaceRequest] = []
    for item in parsed:
        space_type = item.get("space_type")
        if space_type not in VALID_SPACE_TYPES:
            logger.warning("Stripping unrecognized space_type from LLM output: %s", space_type)
            continue
        spaces.append(
            SpaceRequest(
                space_type=SpaceType(space_type),
                count=item.get("count", 1),
                capacity=item.get("capacity"),
            )
        )

    if not spaces:
        raise ValueError("Failed to parse space brief: no valid space types extracted")

    return spaces


async def _call_llm(api_key: str, brief: str) -> str:
    """Call the Google Gemini API and return the text content."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
            headers={"content-type": "application/json"},
            json={
                "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": [{"parts": [{"text": brief}]}],
                "generationConfig": {
                    "maxOutputTokens": 1024,
                    "temperature": 0,
                },
            },
        )

    if response.status_code != 200:
        logger.error("Gemini API error: %s %s", response.status_code, response.text)
        raise RuntimeError(f"Gemini API returned status {response.status_code}")

    body = response.json()
    usage = body.get("usageMetadata", {})
    logger.info(
        "Gemini API usage — prompt_tokens: %s, candidates_tokens: %s",
        usage.get("promptTokenCount"),
        usage.get("candidatesTokenCount"),
    )

    text = body["candidates"][0]["content"]["parts"][0]["text"].strip()
    return text
