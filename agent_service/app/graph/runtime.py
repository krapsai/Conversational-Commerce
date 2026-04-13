from __future__ import annotations

from typing import Any

from langgraph.graph import END, START, StateGraph
from langsmith import traceable, tracing_context

from app.db.agent_db import AgentDatabase
from app.graph.nodes.checkout import checkout_node
from app.graph.nodes.consultant import consultant_node_factory, route_after_consultant
from app.graph.nodes.inventory import inventory_node_factory
from app.graph.nodes.router import route_after_router, router_node_factory
from app.graph.state import AgentState
from app.llm import LLMService
from app.schemas import MessageResponse, SessionPayload
from app.tracing import build_trace_metadata, build_trace_tags
from app.tools.catalog import CATEGORY_MAP


class CatalogTool:
    def __init__(self, agent_db: AgentDatabase, real_db_client) -> None:
        self.agent_db = agent_db
        self.real_db_client = real_db_client

    def get_catalog_snapshot(self) -> dict[str, list[dict[str, Any]]]:
        snapshot: dict[str, list[dict[str, Any]]] = {}

        for slot, category_slugs in CATEGORY_MAP.items():
            mirrored_products = self.agent_db.fetch_catalog_products(category_slugs)
            snapshot[slot] = (
                mirrored_products
                if mirrored_products
                else self.real_db_client.fetch_products_for_categories(category_slugs)
            )

        return snapshot


class AgentRuntime:
    def __init__(self, agent_db: AgentDatabase, real_db_client, settings) -> None:
        self.settings = settings
        self.agent_db = agent_db
        self.real_db_client = real_db_client
        self.catalog_tool = CatalogTool(agent_db, real_db_client)
        self.llm_service = LLMService(settings)
        self.graph = self._build_graph()

    def _build_graph(self):
        graph = StateGraph(AgentState)
        graph.add_node("router", router_node_factory(self.llm_service))
        graph.add_node("consultant", consultant_node_factory(self.llm_service))
        graph.add_node("inventory", inventory_node_factory(self.catalog_tool))
        graph.add_node("checkout", checkout_node)
        graph.add_edge(START, "router")
        graph.add_conditional_edges(
            "router",
            route_after_router,
            {
                "consultant": "consultant",
                "inventory": "inventory",
                "checkout": "checkout",
            },
        )
        graph.add_conditional_edges(
            "consultant",
            route_after_consultant,
            {
                "inventory": "inventory",
                "end": END,
            },
        )
        graph.add_edge("inventory", END)
        graph.add_edge("checkout", END)
        return graph.compile()

    @traceable(name="agent_create_session", run_type="chain")
    def create_session(self, session_id: str | None = None) -> SessionPayload:
        session = self.agent_db.create_session(session_id)
        return SessionPayload.model_validate(session)

    @traceable(name="agent_get_session", run_type="chain")
    def get_session(self, session_id: str) -> SessionPayload:
        session = self.agent_db.get_session_bundle(session_id)
        return SessionPayload.model_validate(session)

    def handle_message(self, session_id: str, message: str) -> MessageResponse:
        trace_metadata = build_trace_metadata(
            self.settings,
            operation="handle_message",
            session_id=session_id,
        )
        trace_tags = build_trace_tags(self.settings, "chat-turn")

        @traceable(
            name="agent_handle_message_turn",
            run_type="chain",
            metadata=trace_metadata,
            tags=trace_tags,
        )
        def _run_turn() -> MessageResponse:
            session = self.agent_db.get_session_bundle(session_id)
            self.agent_db.append_message(
                session_id=session_id,
                role="user",
                agent="router",
                text=message,
            )

            state: AgentState = {
                "session_id": session_id,
                "current_agent": session["current_agent"],
                "intent": "pc_build",
                "conversation_messages": session["messages"],
                "structured_requirements": session.get("structured_requirements") or {},
                "recommended_build": session.get("recommended_build"),
                "status": session["status"],
                "errors": [],
                "latest_user_message": message,
                "ui_action": "none",
            }
            result = self.graph.invoke(
                state,
                config={
                    "run_name": "conversational-commerce-graph",
                    "tags": trace_tags,
                    "metadata": trace_metadata,
                    "configurable": {
                        "thread_id": session_id,
                    },
                },
            )

            assistant_message = result.get("assistant_message")
            if assistant_message:
                self.agent_db.append_message(
                    session_id=session_id,
                    role="assistant",
                    agent=result.get("current_agent", "consultant"),
                    text=assistant_message,
                )

            self.agent_db.upsert_state(result)
            payload = self.agent_db.get_session_bundle(session_id)
            payload["ui_action"] = result.get("ui_action", "none")
            return MessageResponse.model_validate(payload)

        with tracing_context(
            enabled=self.settings.langsmith_tracing,
            project_name=self.settings.langsmith_project,
            metadata=trace_metadata,
            tags=trace_tags,
        ):
            return _run_turn()
