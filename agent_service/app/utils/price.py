from __future__ import annotations


USD_TO_VND_RATE = 26_700


def normalize_price(value: float | int | None) -> float:
    if value is None:
        return 0.0

    price = float(value)
    if price <= 0:
        return 0.0

    if price < 1000:
        return round(price * USD_TO_VND_RATE, 0)

    return round(price, 0)
