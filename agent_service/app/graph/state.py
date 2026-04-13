from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, TypedDict
from uuid import uuid4


class AgentState(TypedDict, total=False):
    session_id: str
    current_agent: str
    intent: str
    conversation_messages: list[dict[str, Any]]
    structured_requirements: dict[str, Any]
    candidate_components: dict[str, list[dict[str, Any]]]
    recommended_build: dict[str, Any] | None
    inventory_verification: dict[str, Any]
    checkout_bundle: dict[str, Any] | None
    errors: list[str]
    status: str
    latest_user_message: str
    inventory_request_kind: str
    assistant_message: str
    next_step: str
    ui_action: str


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_message(role: str, agent: str, text: str) -> dict[str, Any]:
    return {
        "id": uuid4().hex,
        "role": role,
        "agent": agent,
        "text": text,
        "created_at": now_iso(),
    }


def default_requirements() -> dict[str, Any]:
    return {
        "budget_min": None,
        "budget_max": None,
        "usage_profile": None,
        "resolution_target": None,
        "performance_priority": None,
        "preferred_brands": [],
        "needs_monitor": False,
        "needs_peripherals": False,
        "size_preference": None,
        "noise_or_rgb_preference": None,
    }
