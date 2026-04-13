from __future__ import annotations


def build_bundle_items(recommended_build: dict) -> list[dict]:
    return [
        {
            "product": item["product"],
            "quantity": int(item.get("quantity", 1)),
        }
        for item in recommended_build.get("items", [])
    ]
