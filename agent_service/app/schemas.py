from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


AgentName = Literal["router", "consultant", "inventory", "checkout"]
AgentSessionStatus = Literal[
    "collecting_requirements",
    "recommending",
    "awaiting_confirmation",
    "ready_for_checkout",
    "completed",
    "abandoned",
]
UsageProfile = Literal["gaming", "office", "editing", "streaming", "mixed"]


class StructuredRequirements(BaseModel):
    budget_min: float | None = None
    budget_max: float | None = None
    usage_profile: UsageProfile | None = None
    resolution_target: str | None = None
    performance_priority: str | None = None
    preferred_brands: list[str] = Field(default_factory=list)
    needs_monitor: bool = False
    needs_peripherals: bool = False
    size_preference: str | None = None
    noise_or_rgb_preference: str | None = None


class ProductPayload(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    price: float
    originalPrice: float | None = None
    image: str
    categoryId: str
    categoryName: str | None = None
    brand: str
    specs: dict[str, str] = Field(default_factory=dict)
    rating: float = 0
    reviewCount: int = 0
    inStock: bool = True
    isFeatured: bool = False
    isNewArrival: bool = False
    createdAt: str


class ChatMessagePayload(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    agent: AgentName
    text: str
    created_at: datetime


class RecommendedBuildItemPayload(BaseModel):
    slot: str
    quantity: int = 1
    reason: str | None = None
    product: ProductPayload


class RecommendedBuildPayload(BaseModel):
    id: str
    name: str
    summary: str
    total_price: float
    compatibility_notes: list[str] = Field(default_factory=list)
    items: list[RecommendedBuildItemPayload] = Field(default_factory=list)


class SessionPayload(BaseModel):
    session_id: str
    status: AgentSessionStatus
    current_agent: AgentName
    messages: list[ChatMessagePayload]
    structured_requirements: StructuredRequirements | None = None
    recommended_build: RecommendedBuildPayload | None = None


class SessionCreateRequest(BaseModel):
    session_id: str | None = None


class MessageRequest(BaseModel):
    message: str


class MessageResponse(SessionPayload):
    ui_action: Literal["none", "add_bundle", "open_checkout"] = "none"


class BuyBuildRequest(BaseModel):
    session_id: str


class BundleItemPayload(BaseModel):
    product: ProductPayload
    quantity: int = 1


class BuyBuildResponse(BaseModel):
    bundle_id: str
    bundle_items: list[BundleItemPayload]
    checkout_url: str
