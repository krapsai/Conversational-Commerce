from __future__ import annotations

import re
from typing import Any


SOCKET_PATTERN = re.compile(r"\b(AM5|AM4|LGA\s?1700|LGA1700|LGA1851)\b", re.I)
DDR_PATTERN = re.compile(r"\b(DDR4|DDR5)\b", re.I)
WATT_PATTERN = re.compile(r"\b(\d{3,4})\s?W\b", re.I)


def flatten_product_text(product: dict[str, Any]) -> str:
    specs = product.get("specs") or {}
    spec_text = " ".join(str(value) for value in specs.values())
    return " ".join(
        [
            product.get("name", ""),
            product.get("description", ""),
            product.get("brand", ""),
            spec_text,
        ]
    )


def extract_socket(product: dict[str, Any]) -> str | None:
    text = flatten_product_text(product)
    match = SOCKET_PATTERN.search(text)
    if not match:
        return None

    return match.group(1).upper().replace(" ", "")


def extract_ddr_generation(product: dict[str, Any]) -> str | None:
    text = flatten_product_text(product)
    match = DDR_PATTERN.search(text)
    if not match:
        return None

    return match.group(1).upper()


def extract_psu_wattage(product: dict[str, Any]) -> int | None:
    text = flatten_product_text(product)
    match = WATT_PATTERN.search(text)
    if not match:
        return None

    return int(match.group(1))


def estimate_gpu_wattage(product: dict[str, Any]) -> int:
    text = flatten_product_text(product)

    if "5090" in text or "5080" in text:
        return 340
    if "5070" in text or "7900" in text:
        return 285
    if "4060" in text or "4070" in text or "7700" in text:
        return 220

    price = float(product.get("price", 0))
    if price >= 800:
        return 300
    if price >= 450:
        return 220
    return 160


def motherboard_matches_cpu(
    motherboard: dict[str, Any],
    cpu: dict[str, Any],
) -> bool:
    cpu_socket = extract_socket(cpu)
    motherboard_socket = extract_socket(motherboard)

    if cpu_socket and motherboard_socket:
        return cpu_socket == motherboard_socket

    cpu_text = flatten_product_text(cpu).lower()
    motherboard_text = flatten_product_text(motherboard).lower()

    if "amd" in cpu_text:
        return "amd" in motherboard_text or "ryzen" in motherboard_text

    if "intel" in cpu_text:
        return "intel" in motherboard_text or "lga" in motherboard_text

    return True


def ram_matches_motherboard(
    ram: dict[str, Any],
    motherboard: dict[str, Any],
) -> bool:
    ram_ddr = extract_ddr_generation(ram)
    motherboard_ddr = extract_ddr_generation(motherboard)
    return not ram_ddr or not motherboard_ddr or ram_ddr == motherboard_ddr


def psu_supports_gpu(psu: dict[str, Any], gpu: dict[str, Any] | None) -> bool:
    if gpu is None:
        return True

    wattage = extract_psu_wattage(psu)
    if wattage is None:
        return True

    required = estimate_gpu_wattage(gpu) + 250
    return wattage >= required


def build_compatibility_notes(build_items: list[dict[str, Any]]) -> list[str]:
    by_slot = {item["slot"].lower(): item["product"] for item in build_items}
    notes: list[str] = []

    cpu = by_slot.get("cpu")
    motherboard = by_slot.get("motherboard")
    ram = by_slot.get("memory")
    gpu = by_slot.get("graphics")
    psu = by_slot.get("power")

    if cpu and motherboard and motherboard_matches_cpu(motherboard, cpu):
        notes.append("CPU and motherboard socket match the same platform.")

    if motherboard and ram and ram_matches_motherboard(ram, motherboard):
        notes.append("Motherboard and memory match the same DDR generation.")

    if psu and psu_supports_gpu(psu, gpu):
        notes.append("Power supply headroom covers the selected graphics card.")

    if not notes:
        notes.append("Core compatibility rules passed for this build.")

    return notes


def compatibility_passes(build_items: list[dict[str, Any]]) -> bool:
    by_slot = {item["slot"].lower(): item["product"] for item in build_items}

    cpu = by_slot.get("cpu")
    motherboard = by_slot.get("motherboard")
    ram = by_slot.get("memory")
    gpu = by_slot.get("graphics")
    psu = by_slot.get("power")

    if cpu and motherboard and not motherboard_matches_cpu(motherboard, cpu):
        return False
    if motherboard and ram and not ram_matches_motherboard(ram, motherboard):
        return False
    if psu and not psu_supports_gpu(psu, gpu):
        return False
    return True
