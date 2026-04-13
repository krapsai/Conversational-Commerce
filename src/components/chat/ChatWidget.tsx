"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  MessageCircle,
  Send,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import type {
  AgentChatMessage,
  AgentMessageResponse,
  AgentSessionResponse,
  BuyBuildResponse,
  RecommendedBuild,
} from "@/types";

function sortMessages(messages: AgentChatMessage[]) {
  return [...messages].sort((left, right) =>
    left.created_at.localeCompare(right.created_at)
  );
}

export default function ChatWidget() {
  const router = useRouter();
  const { addBundle } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [recommendedBuild, setRecommendedBuild] =
    useState<RecommendedBuild | null>(null);
  const [errorText, setErrorText] = useState("");

  const orderedMessages = useMemo(() => sortMessages(messages), [messages]);
  const hasMessages = orderedMessages.length > 0;
  const syncSessionState = useCallback(
    (data: AgentSessionResponse | AgentMessageResponse) => {
      setSessionId(data.session_id);
      setMessages(sortMessages(data.messages));
      setRecommendedBuild(data.recommended_build ?? null);
      setErrorText("");
    },
    []
  );

  const createSession = useCallback(async () => {
    const response = await fetch("/api/agent/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status}`);
    }

    const data = (await response.json()) as AgentSessionResponse;
    syncSessionState(data);
    return data.session_id;
  }, [syncSessionState]);

  const bootstrapSession = useCallback(async () => {
    setIsHydrating(true);

    try {
      await createSession();
    } catch (error) {
      console.error("Failed to bootstrap agent session:", error);
      setErrorText(
        "Trợ lý cấu hình đang tạm ngắt kết nối. Bạn vẫn có thể mua trực tiếp trong danh mục sản phẩm."
      );
    } finally {
      setIsHydrating(false);
    }
  }, [createSession]);

  useEffect(() => {
    if (!isOpen || hasInitialized) {
      return;
    }

    setHasInitialized(true);
    void bootstrapSession();
  }, [bootstrapSession, hasInitialized, isOpen]);

  async function handleSend() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) {
      return;
    }

    setIsSending(true);

    try {
      const activeSessionId = sessionId ?? (await createSession());
      const response = await fetch(
        `/api/agent/sessions/${activeSessionId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: trimmedMessage }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = (await response.json()) as AgentMessageResponse;
      syncSessionState(data);
      setMessage("");
    } catch (error) {
      console.error("Failed to send agent message:", error);
      setErrorText(
        "Không thể kết nối tới agent service lúc này. Hãy thử lại sau hoặc tiếp tục mua sắm theo cách thông thường."
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleBuyBuild() {
    if (!recommendedBuild || !sessionId || isBuying) {
      return;
    }

    setIsBuying(true);

    try {
      const response = await fetch(
        `/api/agent/builds/${recommendedBuild.id}/buy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id: sessionId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to buy build: ${response.status}`);
      }

      const data = (await response.json()) as BuyBuildResponse;
      addBundle(data.bundle_items);
      router.push(data.checkout_url);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to buy build:", error);
      setErrorText(
        "Không thể tạo bundle checkout từ agent service. Bạn có thể tiếp tục thêm sản phẩm thủ công trong catalog."
      );
    } finally {
      setIsBuying(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex h-[640px] max-h-[82vh] w-[560px] max-w-[98vw] flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-primary-700 px-5 py-4 text-white">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-100">
                Conversational commerce
              </p>
              <h2 className="mt-1 text-lg font-semibold">Trợ lý build PC</h2>
              <p className="text-xs text-primary-100">
                Nhập ngân sách và nhu cầu để agent gợi ý cấu hình phù hợp.
              </p>
            </div>
            <button
              aria-label="Đóng cửa sổ tư vấn"
              className="rounded-full p-2 hover:bg-primary-600"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          <div className="border-b border-primary-100 bg-primary-50 px-4 py-3 text-xs leading-5 text-primary-900">
            Ví dụ: “Tôi cần build PC gaming khoảng 30 triệu để chơi AAA và làm
            việc 2 màn hình”.
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-white px-4 py-4">
            {isHydrating && !hasMessages ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                <Loader2 size={18} className="mr-2 animate-spin" />
                Đang khởi tạo phiên tư vấn…
              </div>
            ) : (
              orderedMessages.map((chatMessage) => {
                const isUser = chatMessage.role === "user";

                return (
                  <div
                    key={chatMessage.id}
                    className={`flex items-start gap-3 ${
                      isUser ? "justify-end" : ""
                    }`}
                  >
                    {!isUser && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-700 text-xs font-semibold text-white">
                        AI
                      </div>
                    )}

                    <div
                      className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                        isUser
                          ? "rounded-tr-sm bg-primary-700 text-white"
                          : "rounded-tl-sm bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] opacity-70">
                        {isUser ? "Bạn" : chatMessage.agent}
                      </div>
                      <p className="whitespace-pre-line">{chatMessage.text}</p>
                    </div>
                  </div>
                );
              })
            )}

            {!hasMessages && !isHydrating && errorText && (
              <div className="rounded-[26px] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                <p>{errorText}</p>
                <button
                  className="mt-3 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                  onClick={() => void bootstrapSession()}
                  type="button"
                >
                  Thử kết nối lại
                </button>
              </div>
            )}

            {recommendedBuild && (
              <div className="rounded-[26px] border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
                      <Sparkles size={14} />
                      Build đề xuất
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900">
                      {recommendedBuild.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {recommendedBuild.summary}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
                      Tổng tạm tính
                    </p>
                    <p className="mt-1 text-lg font-bold text-primary-800">
                      {formatPrice(recommendedBuild.total_price)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {recommendedBuild.items.map((item) => (
                    <div
                      key={`${recommendedBuild.id}-${item.slot}-${item.product.id}`}
                      className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/80 p-3 backdrop-blur"
                    >
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
                        <Image
                          alt={item.product.name}
                          className="object-cover object-center"
                          fill
                          sizes="64px"
                          src={item.product.image}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-700">
                              {item.slot}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-900">
                              {item.product.name}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          SL {item.quantity} • {item.product.brand}
                        </p>
                        {item.reason && (
                          <p className="mt-2 text-xs leading-5 text-gray-600">
                            {item.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {recommendedBuild.compatibility_notes.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-gray-900 px-4 py-3 text-xs leading-5 text-gray-100">
                    {recommendedBuild.compatibility_notes.join(" ")}
                  </div>
                )}

                <button
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-600 px-4 py-3 text-sm font-semibold text-white hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isBuying}
                  onClick={() => void handleBuyBuild()}
                  type="button"
                >
                  {isBuying ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang tạo bundle checkout…
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={16} />
                      Chuyển build sang checkout
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
            {errorText && hasMessages && (
              <p className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                {errorText}
              </p>
            )}

            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSend();
              }}
            >
              <label className="sr-only" htmlFor="agent-message">
                Tin nhắn cho trợ lý build PC
              </label>
              <textarea
                id="agent-message"
                className="max-h-32 min-h-[52px] flex-1 resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Nhập ngân sách, nhu cầu và linh kiện ưu tiên…"
                rows={1}
                value={message}
              />
              <button
                aria-label="Gửi tin nhắn"
                className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary-700 text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSending || message.trim().length === 0}
                type="submit"
              >
                {isSending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        aria-label="Mở trợ lý mua sắm AI"
        className="inline-flex items-center gap-3 rounded-full bg-primary-700 px-4 py-2 text-white shadow-lg hover:bg-primary-800"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600">
          <MessageCircle size={18} />
        </span>
        <div className="flex flex-col items-start">
          <span className="text-[11px] uppercase tracking-[0.16em] text-primary-100">
            AI build assistant
          </span>
          <span className="text-sm font-semibold">Tư vấn cấu hình</span>
        </div>
      </button>
    </div>
  );
}
