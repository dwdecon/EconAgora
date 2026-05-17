import { NextRequest } from "next/server";
import OpenAI from "openai";
import { requireCloudBaseUser, badRequest, serverError } from "@/lib/cloudbase-server-auth";

const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY || "sk-91908ab54bf4465f8b32049aecdb7822",
});

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
    const stream = await deepseek.chat.completions.create({
      model: "deepseek-v4-flash",
      messages: body.messages as any,
      tools: body.tools as any,
      stream: true,
      thinking: { type: "enabled" as const },
      reasoning_effort: "high" as any,
    });

    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      },
    );
  } catch (error) {
    console.error("DeepSeek API error:", error);
    return serverError("Failed to connect to AI service.");
  }
}
