from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.tools.compatibility import (
    build_compatibility_notes,
    compatibility_passes,
    extract_ddr_generation,
    extract_socket,
)


CATEGORY_MAP = {
    "cpu": ["cpu-processors"],
    "motherboard": ["motherboards"],
    "memory": ["memory"],
    "storage": ["internal-solid-state-drives"],
    "power": ["internal-power-supplies"],
    "graphics": ["graphics-cards"],
    "case": ["computer-cases", "towers"],
    "monitor": ["monitors"],
}


@dataclass
class BuildContext:
    usage_profile: str
    budget_max: float
    preferred_brands: list[str]
    needs_monitor: bool


def _score_product(
    product: dict[str, Any],
    *,
    target_price: float,
    preferred_brands: list[str],
    usage_profile: str,
) -> float:
    score = 0.0
    price = float(product.get("price", 0) or 0)
    rating = float(product.get("rating", 0) or 0)
    review_count = int(product.get("reviewCount", 0) or 0)

    if price > 0:
        score -= abs(price - target_price) / max(target_price, 1)

    score += rating / 5
    score += min(review_count, 250) / 500

    preferred_brand_set = {entry.lower() for entry in preferred_brands}
    brand = str(product.get("brand", "")).lower()
    if preferred_brand_set and brand in preferred_brand_set:
        score += 0.35

    text = f"{product.get('name', '')} {product.get('description', '')}".lower()
    if usage_profile == "gaming" and any(
        tag in text for tag in ["gaming", "x3d", "rtx", "radeon"]
    ):
        score += 0.25
    if usage_profile == "office" and "quiet" in text:
        score += 0.1

    return score


def _pick_best(
    products: list[dict[str, Any]],
    *,
    target_price: float,
    preferred_brands: list[str],
    usage_profile: str,
) -> dict[str, Any] | None:
    if not products:
        return None

    ranked = sorted(
        products,
        key=lambda product: _score_product(
            product,
            target_price=target_price,
            preferred_brands=preferred_brands,
            usage_profile=usage_profile,
        ),
        reverse=True,
    )
    return ranked[0]


def _slot_budgets(usage_profile: str, budget_max: float) -> dict[str, float]:
    if usage_profile == "office":
        shares = {
            "cpu": 0.28,
            "motherboard": 0.18,
            "memory": 0.14,
            "storage": 0.14,
            "power": 0.10,
            "case": 0.07,
            "graphics": 0.0,
            "monitor": 0.09,
        }
    elif usage_profile in {"editing", "streaming", "mixed"}:
        shares = {
            "cpu": 0.22,
            "motherboard": 0.15,
            "memory": 0.12,
            "storage": 0.10,
            "power": 0.08,
            "case": 0.05,
            "graphics": 0.28,
            "monitor": 0.10,
        }
    else:
        shares = {
            "cpu": 0.20,
            "motherboard": 0.15,
            "memory": 0.10,
            "storage": 0.08,
            "power": 0.07,
            "case": 0.05,
            "graphics": 0.30,
            "monitor": 0.05,
        }

    return {slot: budget_max * share for slot, share in shares.items()}


def _product_as_item(slot: str, product: dict[str, Any], reason: str) -> dict[str, Any]:
    return {
        "slot": slot,
        "quantity": 1,
        "reason": reason,
        "product": product,
    }


def build_recommendation(
    catalog: dict[str, list[dict[str, Any]]],
    requirements: dict[str, Any],
) -> dict[str, Any] | None:
    usage_profile = requirements.get("usage_profile") or "mixed"
    budget_max = float(requirements.get("budget_max") or 0)
    preferred_brands = list(requirements.get("preferred_brands") or [])
    needs_monitor = bool(requirements.get("needs_monitor"))

    if budget_max <= 0:
        return None

    context = BuildContext(
        usage_profile=usage_profile,
        budget_max=budget_max,
        preferred_brands=preferred_brands,
        needs_monitor=needs_monitor,
    )

    slot_budgets = _slot_budgets(context.usage_profile, context.budget_max)
    build_items: list[dict[str, Any]] = []

    cpu = _pick_best(
        catalog.get("cpu", []),
        target_price=slot_budgets["cpu"],
        preferred_brands=context.preferred_brands,
        usage_profile=context.usage_profile,
    )
    if not cpu:
        return None

    cpu_socket = extract_socket(cpu)
    motherboard_candidates = [
        item
        for item in catalog.get("motherboard", [])
        if not cpu_socket
        or extract_socket(item) == cpu_socket
        or extract_socket(item) is None
    ]
    motherboard = _pick_best(
        motherboard_candidates,
        target_price=slot_budgets["motherboard"],
        preferred_brands=context.preferred_brands,
        usage_profile=context.usage_profile,
    )
    if not motherboard:
        return None

    motherboard_ddr = extract_ddr_generation(motherboard)
    memory_candidates = [
        item
        for item in catalog.get("memory", [])
        if not motherboard_ddr
        or extract_ddr_generation(item) == motherboard_ddr
        or extract_ddr_generation(item) is None
    ]
    memory = _pick_best(
        memory_candidates,
        target_price=slot_budgets["memory"],
        preferred_brands=context.preferred_brands,
        usage_profile=context.usage_profile,
    )
    storage = _pick_best(
        catalog.get("storage", []),
        target_price=slot_budgets["storage"],
        preferred_brands=context.preferred_brands,
        usage_profile=context.usage_profile,
    )
    power = _pick_best(
        catalog.get("power", []),
        target_price=slot_budgets["power"],
        preferred_brands=context.preferred_brands,
        usage_profile=context.usage_profile,
    )
    case = _pick_best(
        catalog.get("case", []),
        target_price=slot_budgets["case"],
        preferred_brands=context.preferred_brands,
        usage_profile=context.usage_profile,
    )

    if not all([memory, storage, power, case]):
        return None

    gpu = None
    if context.usage_profile != "office":
        gpu = _pick_best(
            catalog.get("graphics", []),
            target_price=slot_budgets["graphics"],
            preferred_brands=context.preferred_brands,
            usage_profile=context.usage_profile,
        )

    build_items.extend(
        [
            _product_as_item("CPU", cpu, "Balanced for the requested workload."),
            _product_as_item(
                "Motherboard",
                motherboard,
                "Compatible with the selected CPU platform.",
            ),
            _product_as_item(
                "Memory",
                memory,
                "Matches the platform memory generation.",
            ),
            _product_as_item(
                "Storage",
                storage,
                "Fast solid-state storage for the main build.",
            ),
            _product_as_item(
                "Power",
                power,
                "Chosen with enough headroom for the build.",
            ),
            _product_as_item(
                "Case",
                case,
                "A case choice that keeps the build list complete.",
            ),
        ]
    )

    if gpu:
        build_items.insert(
            3,
            _product_as_item(
                "Graphics",
                gpu,
                "Prioritized for the requested graphics workload.",
            ),
        )

    if context.needs_monitor:
        monitor = _pick_best(
            catalog.get("monitor", []),
            target_price=slot_budgets["monitor"],
            preferred_brands=context.preferred_brands,
            usage_profile=context.usage_profile,
        )
        if monitor:
            build_items.append(
                _product_as_item(
                    "Monitor",
                    monitor,
                    "Included because the shopper asked for a monitor.",
                )
            )

    if not compatibility_passes(build_items):
        return None

    total_price = sum(
        float(item["product"].get("price", 0)) * int(item.get("quantity", 1))
        for item in build_items
    )

    if total_price > context.budget_max * 1.1:
        return None

    return {
        "id": uuid4().hex,
        "name": f"{context.usage_profile.title()} PC Build",
        "summary": (
            f"Generated for a {context.usage_profile} workload with a top budget "
            f"of {int(context.budget_max):,}. Items are filtered for stock-first "
            "selection and simple compatibility rules."
        ),
        "total_price": total_price,
        "compatibility_notes": build_compatibility_notes(build_items),
        "items": build_items,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
