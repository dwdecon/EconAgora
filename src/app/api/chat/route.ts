import { NextRequest, NextResponse } from "next/server";
import { requireCloudBaseUser, badRequest, serverError } from "@/lib/cloudbase-server-auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "sk-91908ab54bf4465f8b32049aecdb7822";

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  let body: { messages?: unknown[]; tools?: unknown[] };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return badRequest("messages is required and must be a non-empty array.");
  }

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: body.messages,
        tools: body.tools,
        stream: true,
        thinking: { type: "enabled" },
        reasoning_effort: "high",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("DeepSeek API error:", response.status, text);
      return serverError("Failed to connect to AI service.");
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("DeepSeek API error:", error);
    return serverError("Failed to connect to AI service.");
  }
}
