import { NextResponse } from "next/server";
import {
  forwardAgentResponse,
  proxyAgentRequest,
} from "@/lib/agent-service";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { sessionId } = await context.params;

  try {
    const response = await proxyAgentRequest(
      `/api/v1/chat/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: "GET",
      }
    );
    return forwardAgentResponse(response);
  } catch (error) {
    console.error("Failed to load agent session:", error);
    return NextResponse.json(
      {
        error:
          "Python agent service is unavailable. Start it with `npm run agent:dev`.",
      },
      { status: 503 }
    );
  }
}
