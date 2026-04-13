import { NextResponse } from "next/server";
import { proxyAgentRequest } from "@/lib/agent-service";
import type { AgentMessageResponse, AgentSessionResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const { message, sessionId } = (await request.json()) as {
      message?: string;
      sessionId?: string;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    let activeSessionId = sessionId;

    if (!activeSessionId) {
      const createResponse = await proxyAgentRequest("/api/v1/chat/sessions", {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create session: ${errorText}`);
      }

      const createdSession =
        (await createResponse.json()) as AgentSessionResponse;
      activeSessionId = createdSession.session_id;
    }

    const response = await proxyAgentRequest(
      `/api/v1/chat/sessions/${encodeURIComponent(activeSessionId)}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Agent service error: ${errorText}`);
    }

    const data = (await response.json()) as AgentMessageResponse;
    const reply =
      [...data.messages]
        .reverse()
        .find((entry) => entry.role === "assistant")
        ?.text ?? "No reply available.";

    return NextResponse.json({
      reply,
      session_id: data.session_id,
      recommended_build: data.recommended_build ?? null,
      ui_action: data.ui_action ?? "none",
    });
  } catch (error) {
    console.error("Chat API proxy error:", error);
    return NextResponse.json(
      {
        error:
          "Python agent service is unavailable. Start it with `npm run agent:dev`.",
      },
      { status: 503 }
    );
  }
}
