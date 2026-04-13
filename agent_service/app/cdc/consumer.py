from __future__ import annotations

import asyncio
import json
from typing import Any

from aiokafka import AIOKafkaConsumer

from app.config import get_settings
from app.db.agent_db import AgentDatabase


def _extract_after_payload(message_value: bytes) -> tuple[str | None, dict[str, Any] | None]:
    envelope = json.loads(message_value.decode("utf-8"))
    payload = envelope.get("payload") or {}
    operation = payload.get("op")
    if operation == "d":
        return operation, payload.get("before")
    return operation, payload.get("after")


class CdcMirrorConsumer:
    def __init__(self, agent_db: AgentDatabase) -> None:
        settings = get_settings()
        self.agent_db = agent_db
        self.consumer = AIOKafkaConsumer(
            f"{settings.kafka_topic_prefix}.Category",
            f"{settings.kafka_topic_prefix}.Product",
            f"{settings.kafka_topic_prefix}.Cart",
            f"{settings.kafka_topic_prefix}.Bundle",
            f"{settings.kafka_topic_prefix}.CheckoutSession",
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id="agent-mirror-consumer",
            enable_auto_commit=True,
        )

    async def run(self) -> None:
        await self.consumer.start()
        try:
            async for message in self.consumer:
                operation, row = _extract_after_payload(message.value)
                if not row or operation == "d":
                    continue

                topic = message.topic.rsplit(".", 1)[-1].lower()
                if topic == "category":
                    self.agent_db.upsert_mirror_category(
                        {
                            "id": row["id"],
                            "slug": row.get("slug"),
                            "name": row.get("name"),
                        }
                    )
                elif topic == "product":
                    category_slug = self.agent_db.get_mirror_category_slug(
                        row.get("categoryId")
                    )
                    self.agent_db.upsert_mirror_product(
                        {
                            "id": row["id"],
                            "name": row["name"],
                            "slug": row["slug"],
                            "description": row["description"],
                            "price": row["price"],
                            "originalPrice": row.get("originalPrice"),
                            "image": row["image"],
                            "categoryId": row["categoryId"],
                            "brand": row["brand"],
                            "specs": row.get("specs") or {},
                            "rating": row.get("rating") or 0,
                            "reviewCount": row.get("reviewCount") or 0,
                            "inStock": row.get("inStock", True),
                            "isFeatured": row.get("isFeatured", False),
                            "isNewArrival": row.get("isNewArrival", False),
                            "createdAt": row.get("createdAt"),
                        },
                        category_slug,
                    )
                else:
                    entity_id = row.get("id")
                    if entity_id:
                        self.agent_db.upsert_commerce_entity(topic, entity_id, row)
        finally:
            await self.consumer.stop()


if __name__ == "__main__":
    settings = get_settings()
    database = AgentDatabase(settings.agent_database_url)
    database.initialize()
    asyncio.run(CdcMirrorConsumer(database).run())
