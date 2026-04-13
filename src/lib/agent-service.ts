import { NextResponse } from "next/server";

const DEFAULT_AGENT_TIMEOUT_MS = 60_000;

function getAgentServiceUrl() {
  const baseUrl = process.env.AGENT_SERVICE_URL?.trim();

  if (!baseUrl) {
    throw new Error("AGENT_SERVICE_URL is not set");
  }

  return baseUrl.replace(/\/$/, "");
}

export async function proxyAgentRequest(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const baseUrl = getAgentServiceUrl();
  const targetUrl = `${baseUrl}${path}`;
  const timeoutMs = Number(process.env.AGENT_SERVICE_TIMEOUT_MS ?? DEFAULT_AGENT_TIMEOUT_MS);

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(targetUrl, {
    ...init,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export async function forwardAgentResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": contentType || "text/plain; charset=utf-8",
    },
  });
}
