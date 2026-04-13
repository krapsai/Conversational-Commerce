from __future__ import annotations

import json
import os
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from dataclasses import dataclass

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langsmith import traceable

from app.config import Settings


@dataclass
class LLMService:
    settings: Settings

    def __post_init__(self) -> None:
        self.enabled = bool(self.settings.openai_api_key)
        if self.settings.langsmith_api_key:
            os.environ["LANGSMITH_API_KEY"] = self.settings.langsmith_api_key
        os.environ["LANGSMITH_TRACING"] = (
            "true" if self.settings.langsmith_tracing else "false"
        )
        os.environ["LANGSMITH_PROJECT"] = self.settings.langsmith_project
        self.client = (
            ChatOpenAI(
                model=self.settings.openai_model,
                temperature=0.2,
                api_key=self.settings.openai_api_key,
                base_url=self.settings.openai_base_url,
                extra_body={"enable_thinking": False},
            )
            if self.settings.openai_api_key
            else None
        )

    def _invoke_with_fallback(self, messages):
        last_error = None

        for client in (self.client,):
            if client is None:
                continue
            try:
                with ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(client.invoke, messages)
                    return future.result(timeout=self.settings.llm_timeout_seconds)
            except FutureTimeoutError as error:
                last_error = TimeoutError(
                    f"LLM request timed out after {self.settings.llm_timeout_seconds} seconds."
                )
                continue
            except Exception as error:
                last_error = error
                continue

        if last_error:
            raise last_error
        raise RuntimeError("No OpenAI-compatible LLM client is configured.")

    @staticmethod
    def _response_text(response) -> str:
        content = getattr(response, "content", "")
        if isinstance(content, list):
            return " ".join(
                part.get("text", "")
                for part in content
                if isinstance(part, dict)
            ).strip()
        if isinstance(content, str):
            return content.strip()
        return str(content).strip()

    @traceable(name="router_route_message", run_type="llm")
    def route_message(
        self,
        latest_message: str,
        *,
        has_requirements: bool,
        has_recommended_build: bool,
    ) -> str | None:
        if not self.enabled:
            return None

        prompt = [
            SystemMessage(
                content=(
                    "You are a router agent for a PC ecommerce assistant. "
                    "Return only one label from this set: "
                    "consultant, inventory, checkout. "
                    "Use checkout only when a recommendation already exists and the user is clearly asking to buy/order/pay. "
                    "Use inventory when enough information exists and the user is asking for recommendations. "
                    "Otherwise use consultant."
                )
            ),
            HumanMessage(
                content=json.dumps(
                    {
                        "latest_message": latest_message,
                        "has_requirements": has_requirements,
                        "has_recommended_build": has_recommended_build,
                    }
                )
            ),
        ]
        try:
            response = self._invoke_with_fallback(prompt)
            label = self._response_text(response).lower()
            if label in {"consultant", "inventory", "checkout"}:
                return label
        except Exception:
            return None
        return None

    @traceable(name="consultant_follow_up", run_type="llm")
    def consultant_follow_up(
        self,
        *,
        latest_user_message: str,
        missing_fields: list[str],
        requirements: dict,
    ) -> str | None:
        if not self.enabled:
            return None

        prompt = [
            SystemMessage(
                content=(
                    "You are a helpful PC-building consultant for an ecommerce site. "
                    "Write one short, natural follow-up message that asks only for the missing information. "
                    "Reply in the exact same language as the user's latest message. "
                    "If the user writes in Vietnamese, reply in Vietnamese. "
                    "If the user writes in English, reply in English. "
                    "Do not switch languages. "
                    "Sound conversational and helpful, not robotic or form-like. "
                    "Do not mention internal systems, fields, JSON, or that anything is missing."
                )
            ),
            HumanMessage(
                content=json.dumps(
                    {
                        "latest_user_message": latest_user_message,
                        "missing_fields": missing_fields,
                        "known_requirements": requirements,
                    }
                )
            ),
        ]
        try:
            response = self._invoke_with_fallback(prompt)
            text = self._response_text(response)
            return text or None
        except Exception:
            return None

    @traceable(name="consultant_ready", run_type="llm")
    def consultant_ready(
        self, latest_user_message: str, requirements: dict
    ) -> str | None:
        if not self.enabled:
            return None

        prompt = [
            SystemMessage(
                content=(
                    "You are a helpful PC-building consultant for an ecommerce site. "
                    "Write one short, natural confirmation that you have enough information and are checking compatible in-stock parts. "
                    "Reply in the exact same language as the user's latest message. "
                    "If the user writes in Vietnamese, reply in Vietnamese. "
                    "If the user writes in English, reply in English. "
                    "Do not switch languages. "
                    "Sound warm and concise, not robotic."
                )
            ),
            HumanMessage(
                content=json.dumps(
                    {
                        "latest_user_message": latest_user_message,
                        "known_requirements": requirements,
                    }
                )
            ),
        ]
        try:
            response = self._invoke_with_fallback(prompt)
            text = self._response_text(response)
            return text or None
        except Exception:
            return None
