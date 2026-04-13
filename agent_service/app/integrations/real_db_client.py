from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import psycopg
from langsmith import traceable
from psycopg.rows import dict_row

from app.tools.catalog import CATEGORY_MAP
from app.utils.price import normalize_price


class RealDatabaseClient:
    def __init__(self, dsn: str) -> None:
        self.dsn = dsn

    def _connect(self):
        return psycopg.connect(self.dsn, row_factory=dict_row)

    def fetch_products_for_categories(self, category_slugs: list[str]) -> list[dict[str, Any]]:
        query = """
        SELECT
          p.id,
          p.name,
          p.slug,
          p.description,
          p.price,
          p."originalPrice",
          p.image,
          p.brand,
          p.specs,
          p.rating,
          p."reviewCount",
          p."inStock",
          p."isFeatured",
          p."isNewArrival",
          p."createdAt",
          p."categoryId",
          c.name AS "categoryName",
          c.slug AS "categorySlug"
        FROM "Product" p
        JOIN "Category" c ON c.id = p."categoryId"
        WHERE c.slug = ANY(%s)
          AND p."inStock" = TRUE
        """

        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, (category_slugs,))
                rows = cursor.fetchall()

        products: list[dict[str, Any]] = []
        for row in rows:
            products.append(
                {
                    "id": row["id"],
                    "name": row["name"],
                    "slug": row["slug"],
                    "description": row["description"],
                    "price": normalize_price(row["price"]),
                    "originalPrice": (
                        normalize_price(row["originalPrice"])
                        if row["originalPrice"]
                        else None
                    ),
                    "image": row["image"],
                    "categoryId": row["categoryId"],
                    "categoryName": row["categoryName"],
                    "categorySlug": row["categorySlug"],
                    "brand": row["brand"],
                    "specs": row["specs"] or {},
                    "rating": float(row["rating"] or 0),
                    "reviewCount": int(row["reviewCount"] or 0),
                    "inStock": bool(row["inStock"]),
                    "isFeatured": bool(row["isFeatured"]),
                    "isNewArrival": bool(row["isNewArrival"]),
                    "createdAt": row["createdAt"].isoformat(),
                }
            )
        return products

    def build_catalog_snapshot(self) -> dict[str, list[dict[str, Any]]]:
        snapshot: dict[str, list[dict[str, Any]]] = {}
        for slot, category_slugs in CATEGORY_MAP.items():
            snapshot[slot] = self.fetch_products_for_categories(category_slugs)
        return snapshot

    @traceable(name="checkout_create_bundle", run_type="tool")
    def create_checkout_bundle(self, session_id: str, recommended_build: dict[str, Any]) -> dict[str, Any]:
        cart_id = uuid4().hex
        bundle_id = uuid4().hex
        checkout_session_id = uuid4().hex
        created_at = datetime.now(timezone.utc)
        checkout_url = "/checkout"
        total_price = float(recommended_build.get("total_price", 0))

        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO "Cart" (id, "externalSessionId", status, source, "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        cart_id,
                        session_id,
                        "active",
                        "agent_service",
                        created_at,
                        created_at,
                    ),
                )
                cursor.execute(
                    """
                    INSERT INTO "Bundle"
                      (id, "externalSessionId", "sourceBuildId", name, summary, status, "totalPrice", currency, "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        bundle_id,
                        session_id,
                        recommended_build["id"],
                        recommended_build["name"],
                        recommended_build["summary"],
                        "ready",
                        total_price,
                        "VND",
                        created_at,
                        created_at,
                    ),
                )

                for item in recommended_build.get("items", []):
                    product = item["product"]
                    quantity = int(item.get("quantity", 1))
                    unit_price = normalize_price(product.get("price", 0))
                    cursor.execute(
                        """
                        INSERT INTO "CartItem"
                          (id, "cartId", "productId", quantity, "unitPrice", "productName", "productImage", "productBrand", "categoryName", "addedAt")
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            uuid4().hex,
                            cart_id,
                            product["id"],
                            quantity,
                            unit_price,
                            product["name"],
                            product["image"],
                            product["brand"],
                            product.get("categoryName"),
                            created_at,
                        ),
                    )
                    cursor.execute(
                        """
                        INSERT INTO "BundleItem"
                          (id, "bundleId", "productId", slot, quantity, "unitPrice", reason, "productName", "productImage", "productBrand", "categoryName")
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            uuid4().hex,
                            bundle_id,
                            product["id"],
                            item["slot"],
                            quantity,
                            unit_price,
                            item.get("reason"),
                            product["name"],
                            product["image"],
                            product["brand"],
                            product.get("categoryName"),
                        ),
                    )

                cursor.execute(
                    """
                    INSERT INTO "CheckoutSession"
                      (id, "cartId", "bundleId", status, "checkoutUrl", "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        checkout_session_id,
                        cart_id,
                        bundle_id,
                        "ready",
                        checkout_url,
                        created_at,
                        created_at,
                    ),
                )
            connection.commit()

        return {
            "bundle_id": bundle_id,
            "bundle_items": [
                {
                    "product": item["product"],
                    "quantity": int(item.get("quantity", 1)),
                }
                for item in recommended_build.get("items", [])
            ],
            "checkout_url": checkout_url,
        }
