from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    agent_database_url: str | None = Field(default=None)
    real_database_url: str = Field(
        default="postgresql://postgres:postgres123@localhost:5432/ecommerce"
    )
    kafka_bootstrap_servers: str = Field(default="localhost:9092")
    kafka_topic_prefix: str = Field(default="dbserver1.public")
    app_env: str = Field(default="development")
    openai_api_key: str | None = Field(default=None)
    openai_base_url: str = Field(default="https://qwenapi.sbs/v1")
    openai_model: str = Field(default="qwen3.6-plus")
    llm_timeout_seconds: float = Field(default=5.0)
    langsmith_api_key: str | None = Field(default=None)
    langsmith_tracing: bool = Field(default=False)
    langsmith_project: str = Field(default="conversational-commerce")
    langsmith_workspace_id: str | None = Field(default=None)
    langsmith_endpoint: str | None = Field(default=None)

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_prefix="",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    if not settings.agent_database_url:
        settings.agent_database_url = settings.real_database_url
    return settings
