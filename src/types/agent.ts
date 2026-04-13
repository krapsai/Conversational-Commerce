import type { Product } from "./catalog";

export type AgentName =
  | "router"
  | "consultant"
  | "inventory"
  | "checkout";

export type AgentSessionStatus =
  | "collecting_requirements"
  | "recommending"
  | "awaiting_confirmation"
  | "ready_for_checkout"
  | "completed"
  | "abandoned";

export type UsageProfile =
  | "gaming"
  | "office"
  | "editing"
  | "streaming"
  | "mixed";

export type ChatUiAction = "none" | "add_bundle" | "open_checkout";

export interface StructuredRequirements {
  budget_min?: number;
  budget_max?: number;
  usage_profile?: UsageProfile;
  resolution_target?: string;
  performance_priority?: string;
  preferred_brands?: string[];
  needs_monitor?: boolean;
  needs_peripherals?: boolean;
  size_preference?: string;
  noise_or_rgb_preference?: string;
}

export interface AgentChatMessage {
  id: string;
  role: "user" | "assistant";
  agent: AgentName;
  text: string;
  created_at: string;
}

export interface RecommendedBuildItem {
  slot: string;
  quantity: number;
  reason?: string;
  product: Product;
}

export interface RecommendedBuild {
  id: string;
  name: string;
  summary: string;
  total_price: number;
  compatibility_notes: string[];
  items: RecommendedBuildItem[];
}

export interface BundleItemPayload {
  product: Product;
  quantity: number;
}

export interface AgentSessionResponse {
  session_id: string;
  status: AgentSessionStatus;
  current_agent: AgentName;
  messages: AgentChatMessage[];
  structured_requirements?: StructuredRequirements;
  recommended_build?: RecommendedBuild | null;
}

export interface AgentMessageResponse extends AgentSessionResponse {
  ui_action?: ChatUiAction;
}

export interface BuyBuildResponse {
  bundle_id: string;
  bundle_items: BundleItemPayload[];
  checkout_url: string;
}
