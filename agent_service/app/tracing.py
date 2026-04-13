from __future__ import annotations

import os
from typing import Any

from app.config import Settings


def configure_langsmith(settings: Settings) -> None:
    if settings.langsmith_api_key:
        os.environ["LANGSMITH_API_KEY"] = settings.langsmith_api_key

    os.environ["LANGSMITH_TRACING"] = (
        "true" if settings.langsmith_tracing else "false"
    )
    os.environ["LANGCHAIN_TRACING_V2"] = (
        "true" if settings.langsmith_tracing else "false"
    )
    os.environ["LANGSMITH_PROJECT"] = settings.langsmith_project

    if settings.langsmith_workspace_id:
        os.environ["LANGSMITH_WORKSPACE_ID"] = settings.langsmith_workspace_id

    if settings.langsmith_endpoint:
        os.environ["LANGSMITH_ENDPOINT"] = settings.langsmith_endpoint


def build_trace_metadata(
    settings: Settings,
    *,
    operation: str,
    session_id: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    metadata: dict[str, Any] = {
        "graph_id": "conversational-commerce-agent",
        "app_env": settings.app_env,
        "operation": operation,
    }

    if session_id:
        metadata["session_id"] = session_id
        metadata["thread_id"] = session_id

    if extra:
        metadata.update(extra)

    return metadata


def build_trace_tags(settings: Settings, *extra_tags: str) -> list[str]:
    tags = ["agent-service", settings.app_env]
    tags.extend(tag for tag in extra_tags if tag)
    return tags
