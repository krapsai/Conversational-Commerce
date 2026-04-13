from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from app.config import get_settings
from app.tracing import configure_langsmith

settings = get_settings()
configure_langsmith(settings)

from app.db.agent_db import AgentDatabase
from app.graph.runtime import AgentRuntime
from app.integrations.real_db_client import RealDatabaseClient
from app.schemas import (
    BuyBuildRequest,
    BuyBuildResponse,
    MessageRequest,
    MessageResponse,
    SessionCreateRequest,
    SessionPayload,
)

agent_db = AgentDatabase(settings.agent_database_url)
real_db_client = RealDatabaseClient(settings.real_database_url)
runtime = AgentRuntime(agent_db, real_db_client, settings)


@asynccontextmanager
async def lifespan(_: FastAPI):
    agent_db.initialize()
    yield


app = FastAPI(
    title="Conversational Commerce Agent Service",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health")
def healthcheck():
    return {"status": "ok", "env": settings.app_env}


@app.get("/api/v1/chat/sessions")
def chat_sessions_info():
    return {
        "message": "Use POST /api/v1/chat/sessions to create or resume a chat session.",
        "next": {
            "create_session": "POST /api/v1/chat/sessions",
            "get_session": "GET /api/v1/chat/sessions/{session_id}",
            "send_message": "POST /api/v1/chat/sessions/{session_id}/messages",
            "buy_build": "POST /api/v1/builds/{build_id}/buy",
        },
    }


@app.post("/api/v1/chat/sessions", response_model=SessionPayload)
def create_session(request: SessionCreateRequest) -> SessionPayload:
    return runtime.create_session(request.session_id)


@app.get("/api/v1/chat/sessions/{session_id}", response_model=SessionPayload)
def get_session(session_id: str) -> SessionPayload:
    try:
        return runtime.get_session(session_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.post(
    "/api/v1/chat/sessions/{session_id}/messages",
    response_model=MessageResponse,
)
def send_message(session_id: str, request: MessageRequest) -> MessageResponse:
    try:
        return runtime.handle_message(session_id, request.message)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.post("/api/v1/builds/{build_id}/buy", response_model=BuyBuildResponse)
def buy_build(build_id: str, request: BuyBuildRequest) -> BuyBuildResponse:
    session = runtime.get_session(request.session_id)
    recommended_build = session.recommended_build

    if recommended_build is None or recommended_build.id != build_id:
        raise HTTPException(
            status_code=404,
            detail="Recommended build was not found for this session.",
        )

    bundle = real_db_client.create_checkout_bundle(
        request.session_id,
        recommended_build.model_dump(),
    )
    return BuyBuildResponse.model_validate(bundle)
