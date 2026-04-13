from __future__ import annotations

from app.graph.state import AgentState


BUY_KEYWORDS = {"buy", "checkout", "order", "purchase", "mua"}
CATALOG_OVERVIEW_KEYWORDS = {
    "co gi",
    "shop co",
    "hien co",
    "dang co",
    "co nhung hang nao",
    "co hang nao",
    "co linh kien nao",
    "co component nao",
    "available",
    "in stock",
    "what do you have",
    "what's available",
    "which brands",
    "which components",
}


def router_node_factory(llm_service):
    def router_node(state: AgentState) -> AgentState:
        latest = (state.get("latest_user_message") or "").lower()
        requirements = state.get("structured_requirements") or {}
        recommended_build = state.get("recommended_build")
        is_catalog_overview_request = any(
            keyword in latest for keyword in CATALOG_OVERVIEW_KEYWORDS
        )

        next_step = "consultant"
        llm_choice = llm_service.route_message(
            latest,
            has_requirements=bool(
                requirements.get("budget_max") and requirements.get("usage_profile")
            ),
            has_recommended_build=bool(recommended_build),
        )
        if llm_choice:
            next_step = llm_choice
        if next_step == "checkout" and not recommended_build:
            next_step = "consultant"
        elif is_catalog_overview_request:
            next_step = "inventory"
        elif recommended_build and any(keyword in latest for keyword in BUY_KEYWORDS):
            next_step = "checkout"
        elif requirements.get("budget_max") and requirements.get("usage_profile"):
            next_step = "inventory"

        state["current_agent"] = "router"
        state["intent"] = "pc_build"
        state["inventory_request_kind"] = (
            "catalog_overview" if is_catalog_overview_request else "build_recommendation"
        )
        state["next_step"] = next_step
        state["ui_action"] = "none"
        return state

    return router_node


def route_after_router(state: AgentState) -> str:
    return state.get("next_step", "consultant")
