import { NextRequest, NextResponse } from "next/server";
import { requireCloudBaseUser, badRequest, serverError } from "@/lib/cloudbase-server-auth";
import { rateLimit, readJsonBody } from "@/lib/request-security";

const MAX_PROVIDER_TOKENS = 8192;
const activeUsers = new Set<string>();
const MESSAGE_ROLES = new Set(["system", "user", "assistant", "tool"]);

function validMessage(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const message = value as Record<string, unknown>;
  if (typeof message.role !== "string" || !MESSAGE_ROLES.has(message.role)) return false;
  if (message.content !== null && message.content !== undefined &&
      (typeof message.content !== "string" || message.content.length > 64_000)) return false;
  if (message.content == null && !Array.isArray(message.tool_calls)) return false;
  if (message.role === "tool" && (typeof message.tool_call_id !== "string" || message.tool_call_id.length > 128)) return false;
  if (message.tool_calls !== undefined && (!Array.isArray(message.tool_calls) || message.tool_calls.length > 32)) return false;
  return true;
}

function validTools(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.length <= 32 && value.every((tool) =>
    tool && typeof tool === "object" && tool.type === "function" && tool.function &&
    typeof tool.function.name === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(tool.function.name) &&
    (tool.function.description === undefined ||
      (typeof tool.function.description === "string" && tool.function.description.length <= 4000)) &&
    (tool.function.parameters === undefined ||
      (tool.function.parameters && typeof tool.function.parameters === "object" && !Array.isArray(tool.function.parameters)))
  ));
}

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) return auth.response;
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: "AI service is not configured." }, { status: 503 });
  const parsed = await readJsonBody(request, 128 * 1024);
  if ("response" in parsed) return parsed.response;
  const { body } = parsed;
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 80 ||
      !body.messages.every(validMessage) || !validTools(body.tools)) {
    return badRequest("Invalid or oversized messages or tools.");
  }
  if (activeUsers.has(auth.user.id) || activeUsers.size >= 3) {
    return NextResponse.json({ error: "AI service is busy. Please try again later." }, {
      status: 429, headers: { "Retry-After": "5", "Cache-Control": "no-store" },
    });
  }
  const limited = rateLimit(`ai:minute:${auth.user.id}`, 10, 60_000) ??
    rateLimit(`ai:day:${auth.user.id}`, 100, 24 * 60 * 60_000);
  if (limited) return limited;
  activeUsers.add(auth.user.id);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]);
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        messages: body.messages,
        ...(body.tools === undefined ? {} : { tools: body.tools }),
        model: "deepseek-v4-flash",
        max_tokens: MAX_PROVIDER_TOKENS,
        stream: false,
        thinking: { type: "enabled" },
        reasoning_effort: "high",
      }),
      signal,
    });
    if (!response.ok) {
      console.error("AI provider request failed with status", response.status);
      return serverError("Failed to connect to AI service.");
    }
    const data = await response.json();
    const message = data.choices?.[0]?.message;
    if (message) {
      delete message.reasoning_content;
      if (!message.tool_calls?.length && typeof message.content === "string") {
        const match = message.content.trim().match(/\{[\s\S]*"action"\s*:\s*\{[\s\S]*\}[\s\S]*\}/);
        if (match) {
          try {
            const parsedAction = JSON.parse(match[0]);
            if (parsedAction.action && (parsedAction.evaluation_previous_goal !== undefined ||
                parsedAction.next_goal !== undefined || parsedAction.memory !== undefined)) {
              message.tool_calls = [{
                id: `call_${Date.now()}`, type: "function",
                function: { name: "AgentOutput", arguments: match[0] },
              }];
              message.content = null;
            }
          } catch {
            // Preserve the original content for the Page Agent fallback parser.
          }
        }
      }
    }
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    if (signal.aborted) {
      return NextResponse.json({ error: "AI request timed out or was cancelled." }, { status: 504 });
    }
    console.error("AI provider request failed.");
    return serverError("Failed to connect to AI service.");
  } finally {
    activeUsers.delete(auth.user.id);
  }
}
