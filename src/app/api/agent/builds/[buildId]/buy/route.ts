import { NextResponse } from "next/server";
import {
  forwardAgentResponse,
  proxyAgentRequest,
} from "@/lib/agent-service";

interface RouteContext {
  params: Promise<{ buildId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { buildId } = await context.params;

  try {
    const body = await request.text();
    const response = await proxyAgentRequest(
      `/api/v1/builds/${encodeURIComponent(buildId)}/buy`,
      {
        method: "POST",
        body,
      }
    );
    return forwardAgentResponse(response);
  } catch (error) {
    console.error("Failed to buy recommended build:", error);
    return NextResponse.json(
      {
        error:
          "Python agent service is unavailable. Start it with `npm run agent:dev`.",
      },
      { status: 503 }
    );
  }
}
