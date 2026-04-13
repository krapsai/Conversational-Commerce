from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from app.graph.state import default_requirements


def _json_default(value: Any):
    if isinstance(value, datetime):
        return value.isoformat()
    raise TypeError(f"Object of type {value.__class__.__name__} is not JSON serializable")


def _jsonb(value: Any) -> Jsonb:
    return Jsonb(value, dumps=lambda obj: json.dumps(obj, default=_json_default))


class AgentDatabase:
    def __init__(self, dsn: str) -> None:
        self.dsn = dsn

    def _connect(self):
        return psycopg.connect(self.dsn, row_factory=dict_row)

    def initialize(self) -> None:
        ddl = """
        CREATE TABLE IF NOT EXISTS agent_sessions (
          id TEXT PRIMARY KEY,
          current_agent TEXT NOT NULL,
          status TEXT NOT NULL,
          intent TEXT,
          raw_state JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS agent_messages (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          agent TEXT NOT NULL,
          text TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS agent_requirements (
          session_id TEXT PRIMARY KEY REFERENCES agent_sessions(id) ON DELETE CASCADE,
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS agent_build_recommendations (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          summary TEXT NOT NULL,
          total_price DOUBLE PRECISION NOT NULL,
          compatibility_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS agent_build_items (
          id TEXT PRIMARY KEY,
          recommendation_id TEXT NOT NULL REFERENCES agent_build_recommendations(id) ON DELETE CASCADE,
          slot TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          reason TEXT,
          product_payload JSONB NOT NULL
        );
        CREATE TABLE IF NOT EXISTS agent_checkpoints (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
          checkpoint JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS agent_tool_logs (
          id TEXT PRIMARY KEY,
          session_id TEXT,
          tool_name TEXT NOT NULL,
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS mirror_categories (
          id TEXT PRIMARY KEY,
          slug TEXT,
          name TEXT,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS mirror_products (
          id TEXT PRIMARY KEY,
          category_slug TEXT,
          category_name TEXT,
          in_stock BOOLEAN NOT NULL DEFAULT TRUE,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS mirror_commerce_entities (
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (entity_type, entity_id)
        );
        """
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(ddl)
            connection.commit()

    def create_session(self, session_id: str | None = None) -> dict[str, Any]:
        session_id = session_id or uuid4().hex
        now = datetime.now(timezone.utc)

        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO agent_sessions (id, current_agent, status, intent, raw_state, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    (
                        session_id,
                        "consultant",
                        "collecting_requirements",
                        "pc_build",
                        _jsonb({}),
                        now,
                        now,
                    ),
                )
                cursor.execute(
                    """
                    INSERT INTO agent_requirements (session_id, payload, updated_at)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (session_id) DO NOTHING
                    """,
                    (session_id, _jsonb(default_requirements()), now),
                )
            connection.commit()

        return self.get_session_bundle(session_id)

    def append_message(self, session_id: str, role: str, agent: str, text: str) -> None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO agent_messages (id, session_id, role, agent, text)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (uuid4().hex, session_id, role, agent, text),
                )
            connection.commit()

    def list_messages(self, session_id: str) -> list[dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, role, agent, text, created_at
                    FROM agent_messages
                    WHERE session_id = %s
                    ORDER BY created_at ASC
                    """,
                    (session_id,),
                )
                return cursor.fetchall()

    def get_session_row(self, session_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, current_agent, status, intent, raw_state
                    FROM agent_sessions
                    WHERE id = %s
                    """,
                    (session_id,),
                )
                return cursor.fetchone()

    def get_requirements(self, session_id: str) -> dict[str, Any]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT payload
                    FROM agent_requirements
                    WHERE session_id = %s
                    """,
                    (session_id,),
                )
                row = cursor.fetchone()
                return row["payload"] if row else default_requirements()

    def upsert_state(self, state: dict[str, Any]) -> None:
        session_id = state["session_id"]
        recommended_build = state.get("recommended_build")
        requirements = state.get("structured_requirements") or default_requirements()

        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE agent_sessions
                    SET current_agent = %s,
                        status = %s,
                        intent = %s,
                        raw_state = %s,
                        updated_at = NOW()
                    WHERE id = %s
                    """,
                    (
                        state.get("current_agent", "router"),
                        state.get("status", "collecting_requirements"),
                        state.get("intent", "pc_build"),
                        _jsonb(state),
                        session_id,
                    ),
                )
                cursor.execute(
                    """
                    INSERT INTO agent_requirements (session_id, payload, updated_at)
                    VALUES (%s, %s, NOW())
                    ON CONFLICT (session_id)
                    DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
                    """,
                    (session_id, _jsonb(requirements)),
                )
                cursor.execute(
                    """
                    INSERT INTO agent_checkpoints (id, session_id, checkpoint)
                    VALUES (%s, %s, %s)
                    """,
                    (uuid4().hex, session_id, _jsonb(state)),
                )
                if recommended_build:
                    recommendation_id = recommended_build["id"]
                    cursor.execute(
                        """
                        INSERT INTO agent_build_recommendations
                          (id, session_id, name, summary, total_price, compatibility_notes, payload, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                        ON CONFLICT (id)
                        DO UPDATE SET
                          name = EXCLUDED.name,
                          summary = EXCLUDED.summary,
                          total_price = EXCLUDED.total_price,
                          compatibility_notes = EXCLUDED.compatibility_notes,
                          payload = EXCLUDED.payload,
                          updated_at = NOW()
                        """,
                        (
                            recommendation_id,
                            session_id,
                            recommended_build["name"],
                            recommended_build["summary"],
                            recommended_build["total_price"],
                            _jsonb(recommended_build.get("compatibility_notes", [])),
                            _jsonb(recommended_build),
                        ),
                    )
                    cursor.execute(
                        "DELETE FROM agent_build_items WHERE recommendation_id = %s",
                        (recommendation_id,),
                    )
                    for item in recommended_build.get("items", []):
                        cursor.execute(
                            """
                            INSERT INTO agent_build_items
                              (id, recommendation_id, slot, quantity, reason, product_payload)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            """,
                            (
                                uuid4().hex,
                                recommendation_id,
                                item["slot"],
                                item.get("quantity", 1),
                                item.get("reason"),
                                _jsonb(item["product"]),
                            ),
                        )
            connection.commit()

    def get_recommended_build(self, session_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, name, summary, total_price, compatibility_notes, payload
                    FROM agent_build_recommendations
                    WHERE session_id = %s
                    ORDER BY updated_at DESC
                    LIMIT 1
                    """,
                    (session_id,),
                )
                row = cursor.fetchone()
                return row["payload"] if row else None

    def get_session_bundle(self, session_id: str) -> dict[str, Any]:
        session = self.get_session_row(session_id)
        if not session:
            raise KeyError(f"Unknown session: {session_id}")
        return {
            "session_id": session["id"],
            "status": session["status"],
            "current_agent": session["current_agent"],
            "messages": self.list_messages(session_id),
            "structured_requirements": self.get_requirements(session_id),
            "recommended_build": self.get_recommended_build(session_id),
        }

    def fetch_catalog_products(self, category_slugs: list[str]) -> list[dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT payload
                    FROM mirror_products
                    WHERE category_slug = ANY(%s)
                      AND in_stock = TRUE
                    """,
                    (category_slugs,),
                )
                rows = cursor.fetchall()
                return [row["payload"] for row in rows]

    def get_mirror_category_slug(self, category_id: str | None) -> str | None:
        if not category_id:
            return None

        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT slug
                    FROM mirror_categories
                    WHERE id = %s
                    """,
                    (category_id,),
                )
                row = cursor.fetchone()
                return row["slug"] if row else None

    def upsert_mirror_category(self, category: dict[str, Any]) -> None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO mirror_categories (id, slug, name, payload, updated_at)
                    VALUES (%s, %s, %s, %s, NOW())
                    ON CONFLICT (id)
                    DO UPDATE SET slug = EXCLUDED.slug,
                                  name = EXCLUDED.name,
                                  payload = EXCLUDED.payload,
                                  updated_at = NOW()
                    """,
                    (
                        category["id"],
                        category.get("slug"),
                        category.get("name"),
                        _jsonb(category),
                    ),
                )
            connection.commit()

    def upsert_mirror_product(self, product: dict[str, Any], category_slug: str | None) -> None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO mirror_products
                      (id, category_slug, category_name, in_stock, payload, updated_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (id)
                    DO UPDATE SET
                      category_slug = EXCLUDED.category_slug,
                      category_name = EXCLUDED.category_name,
                      in_stock = EXCLUDED.in_stock,
                      payload = EXCLUDED.payload,
                      updated_at = NOW()
                    """,
                    (
                        product["id"],
                        category_slug,
                        product.get("categoryName"),
                        bool(product.get("inStock", True)),
                        _jsonb(product),
                    ),
                )
            connection.commit()

    def upsert_commerce_entity(self, entity_type: str, entity_id: str, payload: dict[str, Any]) -> None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO mirror_commerce_entities (entity_type, entity_id, payload, updated_at)
                    VALUES (%s, %s, %s, NOW())
                    ON CONFLICT (entity_type, entity_id)
                    DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
                    """,
                    (entity_type, entity_id, _jsonb(payload)),
                )
            connection.commit()
