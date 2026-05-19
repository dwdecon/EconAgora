import { NextRequest, NextResponse } from "next/server";
import { requireCloudBaseUser, badRequest, serverError } from "@/lib/cloudbase-server-auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "sk-91908ab54bf4465f8b32049aecdb7822";

export async function POST(request: NextRequest) {
  const auth = await requireCloudBaseUser(request);
  if ("response" in auth) {
    return auth.response;
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return badRequest("messages is required and must be a non-empty array.");
  }

  try {
    // DeepSeek reasoner (triggered by thinking mode) does not support tool_choice
    const { tool_choice, parallel_tool_calls, ...forwardBody } = body;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        ...forwardBody,
        model: "deepseek-v4-flash",
        stream: false,
        thinking: { type: "enabled" },
        reasoning_effort: "high",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("DeepSeek API error:", response.status, text);
      return serverError("Failed to connect to AI service.");
    }

    const data = await response.json();

    // Clean up reasoning_content that Page Agent doesn't expect
    if (data.choices?.[0]?.message) {
      const msg = data.choices[0].message;

      // Remove thinking content
      delete msg.reasoning_content;

      // DeepSeek reasoner sometimes puts tool call JSON in `content` instead of `tool_calls`.
      // When this happens, extract it and restructure as a proper tool_call so
      // normalizeResponse can parse it cleanly.
      if (!msg.tool_calls?.length && typeof msg.content === "string") {
        const content = msg.content.trim();
        // Try to find JSON that looks like an AgentOutput argument
        // Pattern: contains "action" and at least one of the reflection fields
        const jsonMatch = content.match(/\{[\s\S]*"action"\s*:\s*\{[\s\S]*\}[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.action && (parsed.evaluation_previous_goal !== undefined || parsed.next_goal !== undefined || parsed.memory !== undefined)) {
              msg.tool_calls = [{
                id: `call_${Date.now()}`,
                type: "function",
                function: {
                  name: "AgentOutput",
                  arguments: jsonMatch[0],
                },
              }];
              // Clear content since it's now in tool_calls
              msg.content = null;
            }
          } catch {
            // JSON parse failed — leave content as-is for normalizeResponse fallback
          }
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("DeepSeek API error:", error);
    return serverError("Failed to connect to AI service.");
  }
}
