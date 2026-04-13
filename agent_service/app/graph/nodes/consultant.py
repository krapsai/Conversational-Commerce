from __future__ import annotations

import re
from typing import Any

from langchain_core.prompts import PromptTemplate

from app.graph.state import AgentState, default_requirements


BUDGET_PATTERN = re.compile(r"(\d[\d\.,]*)\s*(m|mil|million|tr|k|vnd)?", re.I)

USAGE_KEYWORDS = {
    "gaming": ["gaming", "game", "fps", "esports"],
    "office": ["office", "work", "excel", "word", "study", "learn"],
    "editing": ["editing", "render", "premiere", "after effects", "davinci"],
    "streaming": ["stream", "obs", "twitch", "youtube"],
    "mixed": ["mixed", "all-round", "general"],
}

BRAND_KEYWORDS = ["amd", "intel", "asus", "msi", "gigabyte", "corsair", "samsung"]
FOLLOW_UP_TEMPLATE = PromptTemplate.from_template("{message}")
READY_TEMPLATE = PromptTemplate.from_template("{message}")


def _parse_budget(latest_message: str) -> tuple[float | None, float | None]:
    normalized = latest_message.lower().replace(",", "").replace(".", "")
    for match in BUDGET_PATTERN.finditer(normalized):
        raw_amount = match.group(1)
        suffix = (match.group(2) or "").lower()
        if not raw_amount:
            continue

        amount = float(raw_amount)
        if suffix in {"m", "mil", "million", "tr"}:
            amount *= 1_000_000
        elif suffix == "k":
            amount *= 1_000

        if amount >= 1_000_000:
            return amount * 0.9, amount

    return None, None


def _parse_usage(latest_message: str) -> str | None:
    lowered = latest_message.lower()
    for usage_profile, keywords in USAGE_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return usage_profile
    return None


def _parse_brands(latest_message: str) -> list[str]:
    lowered = latest_message.lower()
    return [brand.upper() for brand in BRAND_KEYWORDS if brand in lowered]


def _parse_switches(latest_message: str) -> dict[str, Any]:
    lowered = latest_message.lower()
    return {
        "needs_monitor": "monitor" in lowered or "screen" in lowered,
        "needs_peripherals": any(
            token in lowered for token in ["keyboard", "mouse", "peripheral"]
        ),
        "noise_or_rgb_preference": (
            "rgb" if "rgb" in lowered else ("quiet" if "quiet" in lowered else None)
        ),
    }


def _detect_language(latest_message: str) -> str:
    lowered = latest_message.lower()
    vietnamese_markers = [
        "xin",
        "toi",
        "minh",
        "ban",
        "ngan sach",
        "may tinh",
        "choi game",
        "cau hinh",
        "duoc khong",
        "giup minh",
        "tu van",
    ]
    if any(marker in lowered for marker in vietnamese_markers):
        return "vi"
    return "en"


def consultant_node_factory(llm_service):
    def consultant_node(state: AgentState) -> AgentState:
        latest_message = state.get("latest_user_message", "")
        language = _detect_language(latest_message)
        requirements = {
            **default_requirements(),
            **(state.get("structured_requirements") or {}),
        }

        budget_min, budget_max = _parse_budget(latest_message)
        if budget_min and budget_max:
            requirements["budget_min"] = budget_min
            requirements["budget_max"] = budget_max

        usage_profile = _parse_usage(latest_message)
        if usage_profile:
            requirements["usage_profile"] = usage_profile

        preferred_brands = set(requirements.get("preferred_brands") or [])
        preferred_brands.update(_parse_brands(latest_message))
        requirements["preferred_brands"] = sorted(preferred_brands)

        switches = _parse_switches(latest_message)
        requirements["needs_monitor"] = (
            requirements.get("needs_monitor") or switches["needs_monitor"]
        )
        requirements["needs_peripherals"] = (
            requirements.get("needs_peripherals") or switches["needs_peripherals"]
        )
        if switches["noise_or_rgb_preference"]:
            requirements["noise_or_rgb_preference"] = switches[
                "noise_or_rgb_preference"
            ]

        missing_fields: list[str] = []
        if not requirements.get("budget_max"):
            missing_fields.append("budget")
        if not requirements.get("usage_profile"):
            missing_fields.append("usage")

        state["structured_requirements"] = requirements
        state["current_agent"] = "consultant"

        if missing_fields:
            fallback_map = {
                "vi": {
                    ("budget",): "Minh co the len cau hinh luon. Ban cho minh xin muc ngan sach toi da truoc nhe?",
                    ("usage",): "Ban dinh dung PC chu yeu cho nhu cau nao: gaming, lam viec van phong, chinh sua video, streaming hay da dung?",
                    (
                        "budget",
                        "usage",
                    ): "Minh co the tu van nhanh hon neu ban cho minh 2 thong tin: ngan sach toi da va nhu cau chinh, vi du gaming, lam viec, edit video hoac streaming.",
                    "default": "Ban cho minh them mot chut thong tin ve ngan sach va nhu cau su dung de minh len cau hinh phu hop nhe.",
                },
                "en": {
                    ("budget",): "I can put together a build for you. What is your maximum budget?",
                    ("usage",): "What will you mainly use the PC for: gaming, office work, video editing, streaming, or a mixed workload?",
                    (
                        "budget",
                        "usage",
                    ): "I can give you a much better recommendation if you share two things first: your maximum budget and your main use case, such as gaming, work, video editing, or streaming.",
                    "default": "Share a bit more about your budget and main use case so I can suggest a better-fitting build.",
                },
            }
            llm_follow_up = llm_service.consultant_follow_up(
                latest_user_message=latest_message,
                missing_fields=missing_fields,
                requirements=requirements,
            )
            fallback_bundle = fallback_map[language]
            fallback_message = fallback_bundle.get(
                tuple(missing_fields),
                fallback_bundle["default"],
            )
            state["assistant_message"] = llm_follow_up or FOLLOW_UP_TEMPLATE.format(
                message=fallback_message
            )
            state["status"] = "collecting_requirements"
            state["next_step"] = "end"
            return state

        ready_fallback = {
            "vi": (
                f"On roi, minh da co du thong tin cho mot bo PC thien ve {requirements['usage_profile']}. "
                "Minh dang kiem tra cac linh kien tuong thich va con hang cho ban."
            ),
            "en": (
                f"That is enough for me to work with for a {requirements['usage_profile']} PC build. "
                "I am now checking compatible parts that are currently in stock for you."
            ),
        }
        state["assistant_message"] = llm_service.consultant_ready(
            latest_message,
            requirements,
        ) or READY_TEMPLATE.format(message=ready_fallback[language])
        state["status"] = "recommending"
        state["next_step"] = "inventory"
        return state

    return consultant_node


def route_after_consultant(state: AgentState) -> str:
    return state.get("next_step", "end")
