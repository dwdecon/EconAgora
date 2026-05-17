#!/usr/bin/env tsx
/**
 * Generate blog cover image using gpt-image-2 via Responses API
 *
 * Usage:
 *   tsx scripts/content-pipeline/generate-cover.ts "article-title" "article-excerpt"
 *
 * Environment:
 *   OPENAI_API_KEY - API key (default: from .env.local)
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const API_URL = "https://coding.rexai.top/openai/v1/responses";
const OUTPUT_DIR = path.join(process.cwd(), "public/blog-covers");

function getApiKey(): string {
  // Try environment variable first
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // Try .env.local
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    const match = content.match(/OPENAI_API_KEY=([^\r\n]+)/);
    if (match) return match[1].trim();
  }

  throw new Error(
    "OPENAI_API_KEY not found. Set it in environment or .env.local"
  );
}

function generatePrompt(title: string, excerpt: string): string {
  return `A clean, modern illustration about ${title}. 
The scene should evoke academic research and AI technology fusion.
Soft color palette with subtle gradients (blues, purples, warm accents).
Minimalist composition with geometric elements.
No text, no logos, no watermarks.
Professional economics research blog header image style.
High quality, detailed, 1536x1024 landscape format.`;
}

function generateCover(
  title: string,
  excerpt: string,
  outputPath: string
): void {
  const apiKey = getApiKey();
  const prompt = generatePrompt(title, excerpt);

  const payload = {
    model: "gpt-5.5",
    stream: true,
    input: prompt,
    tools: [
      {
        type: "image_generation",
        model: "gpt-image-2",
        size: "1536x1024",
        quality: "high",
      },
    ],
  };

  // Build curl command
  const curlCmd = [
    "curl",
    "-sS",
    "-N",
    "--max-time",
    "600",
    API_URL,
    "-H",
    "Content-Type: application/json",
    "-H",
    "Accept: text/event-stream",
    "-H",
    `Authorization: Bearer ${apiKey}`,
    "-d",
    JSON.stringify(payload),
  ];

  console.log(`Generating cover for: ${title}`);
  console.log(`Output: ${outputPath}`);

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Execute curl and parse SSE
  const proc = require("child_process").spawn(curlCmd[0], curlCmd.slice(1), {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let event: string | null = null;
  const dataLines: string[] = [];

  proc.stdout.on("data", (chunk: Buffer) => {
    const lines = chunk.toString().split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("event:")) {
        event = trimmed.slice(6).trim();
      } else if (trimmed.startsWith("data:")) {
        dataLines.push(trimmed.slice(5).trim());
      } else if (!trimmed && event && dataLines.length > 0) {
        const dataText = dataLines.join("\n").trim();
        if (dataText && dataText !== "[DONE]") {
          try {
            const obj = JSON.parse(dataText);
            if (obj.type === "response.output_item.done") {
              const item = obj.item || {};
              if (
                item.type === "image_generation_call" &&
                item.result
              ) {
                const imgBytes = Buffer.from(item.result, "base64");
                fs.writeFileSync(outputPath, imgBytes);
                console.log(`✅ Cover saved: ${outputPath}`);
                proc.kill();
                return;
              }
            }
          } catch (e) {
            // Ignore parse errors for non-JSON lines
          }
        }
        event = null;
        dataLines.length = 0;
      }
    }
  });

  proc.stderr.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    if (text) console.error("stderr:", text);
  });

  proc.on("close", (code: number) => {
    if (code !== 0 && code !== null) {
      console.error(`curl exited with code ${code}`);
      process.exit(1);
    }
  });
}

// CLI entry
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: tsx generate-cover.ts <title> <excerpt> [output-path]");
    process.exit(1);
  }

  const [title, excerpt, customPath] = args;

  // Generate default path if not provided
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  const timestamp = Date.now();

  const outputPath =
    customPath || path.join(OUTPUT_DIR, `${year}`, `${month}`, `${slug}-${timestamp}.png`);

  generateCover(title, excerpt, outputPath);
}

export { generateCover, generatePrompt };
