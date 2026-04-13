import { NextResponse } from "next/server";
import {
  forwardAgentResponse,
  proxyAgentRequest,
} from "@/lib/agent-service";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const response = await proxyAgentRequest("/api/v1/chat/sessions", {
      method: "POST",
      body,
    });
    return forwardAgentResponse(response);
  } catch (error) {
    console.error("Failed to create agent session:", error);
    return NextResponse.json(
      {
        error:
          "Python agent service is unavailable. Start it with `npm run agent:dev`.",
      },
      { status: 503 }
    );
  }
}
