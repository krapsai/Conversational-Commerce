from __future__ import annotations

from app.graph.state import AgentState


def checkout_node(state: AgentState) -> AgentState:
    state["current_agent"] = "checkout"
    state["status"] = "ready_for_checkout"
    state["ui_action"] = "open_checkout"
    state["assistant_message"] = (
        "The build is ready. Use the Buy this build action to create the bundle "
        "and jump to checkout."
    )
    state["next_step"] = "end"
    return state
