from __future__ import annotations

from app.graph.state import AgentState
from app.tools.catalog import build_recommendation


def _top_brands(products: list[dict], limit: int = 4) -> list[str]:
    seen: list[str] = []
    for product in products:
        brand = str(product.get("brand") or "").strip()
        if brand and brand not in seen:
            seen.append(brand)
        if len(seen) >= limit:
            break
    return seen


def _sample_names(products: list[dict], limit: int = 3) -> list[str]:
    names: list[str] = []
    for product in products:
        name = str(product.get("name") or "").strip()
        if name and name not in names:
            names.append(name)
        if len(names) >= limit:
            break
    return names


def _format_catalog_overview(catalog: dict[str, list[dict]]) -> str:
    slot_labels = {
        "cpu": "CPU",
        "motherboard": "mainboard",
        "memory": "RAM",
        "storage": "SSD/storage",
        "power": "PSU",
        "graphics": "GPU",
        "case": "case",
        "monitor": "monitor",
    }
    preferred_slots = [
        "cpu",
        "graphics",
        "motherboard",
        "memory",
        "storage",
    ]

    lines: list[str] = [
        "Hien shop dang co san mot so nhom linh kien nhu:"
    ]
    for slot in preferred_slots:
        products = catalog.get(slot, [])
        if not products:
            continue
        brands = _top_brands(products)
        samples = _sample_names(products, limit=2)
        summary = f"- {slot_labels[slot]}: {', '.join(brands)}"
        if samples:
            summary += f" ({'; '.join(samples)})"
        lines.append(summary)

    lines.append(
        "Neu ban muon, minh co the goi y tiep theo budget, nhu cau, hoac loc rieng theo hang nhu AMD, Intel, ASUS, MSI, Gigabyte..."
    )
    return "\n".join(lines)


def inventory_node_factory(catalog_tool):
    def inventory_node(state: AgentState) -> AgentState:
        requirements = state.get("structured_requirements") or {}
        catalog = catalog_tool.get_catalog_snapshot()
        request_kind = state.get("inventory_request_kind") or "build_recommendation"

        state["current_agent"] = "inventory"

        if request_kind == "catalog_overview":
            state["assistant_message"] = _format_catalog_overview(catalog)
            state["status"] = "collecting_requirements"
            state["next_step"] = "end"
            return state

        recommendation = build_recommendation(catalog, requirements)

        if not recommendation:
            state["assistant_message"] = (
                "I could not produce a compatible build within the current budget. "
                "Try a higher budget or a lighter workload target."
            )
            state["status"] = "collecting_requirements"
            state["next_step"] = "end"
            return state

        state["recommended_build"] = recommendation
        state["inventory_verification"] = {
            "checked_stock": True,
            "compatibility_passed": True,
        }
        state["assistant_message"] = (
            f"I prepared {recommendation['name']} with "
            f"{len(recommendation['items'])} items. Review it and click "
            "Buy this build when you are ready."
        )
        state["status"] = "awaiting_confirmation"
        state["next_step"] = "end"
        return state

    return inventory_node
