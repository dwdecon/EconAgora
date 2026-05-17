#!/usr/bin/env tsx
/**
 * 封面图生成脚本 - 使用 RexAI Responses API
 * 用法: npx tsx scripts/content-pipeline/generate-cover-simple.ts "标题" "输出路径"
 */

import * as fs from "fs";
import * as path from "path";

const API_KEY = process.env.REXAI_API_KEY || process.env.OPENAI_API_KEY || "cr_0e1883fb26514dff97789571937b1791a3d8e5c2fbfab73dd776c9475a7b2de3";
const API_BASE = "https://coding.rexai.top/openai/v1";

async function generateCover(title: string, outputPath: string) {
  console.log(`Generating cover: ${title}`);
  console.log(`Output: ${outputPath}`);

  const prompt = `Create a horizontal cover image (3:2 landscape ratio, 1536x1024) for an economics research blog article.

Theme: "${title}"

Visual style: Clean, modern, professional watercolor hand-drawn tech illustration. Soft orange-blue gradient background with warm orange and cool blue as main colors, white as accent.

Composition: Include symbolic elements that clearly convey the core concept of the article theme. For example: if about growth and trends, use rising curves, glowing arrows, data streams; if about policy and structure, use scales, gears, connection nodes and documents. Naturally incorporate some of these elements when relevant: semi-transparent browser windows, data charts/graphs, magnifying glass, abstract user avatars. Element selection should serve the theme expression, with balanced and logically connected layout.

Atmosphere: Professional yet approachable, suitable for academic researchers.

Strictly NO text, letters, numbers, or words in the image. The image must be completely free of any textual content.

Color palette: Warm orange + cool blue + white accents.`;

  const requestBody = {
    model: "gpt-5.5",
    stream: true,
    input: prompt,
    tools: [{
      type: "image_generation" as const,
      model: "gpt-image-2",
      size: "1536x1024",
      quality: "high"
    }]
  };

  const response = await fetch(`${API_BASE}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "Accept": "text/event-stream"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} ${errorText}`);
  }

  // Read SSE stream
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let imageBase64: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6);
      if (data === "[DONE]") continue;

      try {
        const event = JSON.parse(data);

        // Look for output_item.done event with image_generation_call result
        if (event.type === "response.output_item.done") {
          const item = event.item;
          if (item?.type === "image_generation_call" && item.result) {
            imageBase64 = item.result;
            console.log("✓ Image generated successfully");
          }
        }

        // Also check response.completed for output items
        if (event.type === "response.completed" && event.response?.output) {
          for (const outputItem of event.response.output) {
            if (outputItem.type === "image_generation_call" && outputItem.result) {
              imageBase64 = outputItem.result;
              console.log("✓ Image found in response.completed");
            }
          }
        }
      } catch (e) {
        // Ignore parse errors for non-JSON lines
      }
    }
  }

  if (!imageBase64) {
    throw new Error("No image data received from API");
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save image
  const imageBuffer = Buffer.from(imageBase64, "base64");
  fs.writeFileSync(outputPath, imageBuffer);

  console.log(`✓ Cover saved to: ${outputPath}`);
  console.log(`  Size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
}

// Main
async function main() {
  const title = process.argv[2];
  const outputPath = process.argv[3];

  if (!title || !outputPath) {
    console.error("Usage: npx tsx generate-cover-simple.ts \"Article Title\" \"output/path.png\"");
    process.exit(1);
  }

  try {
    await generateCover(title, outputPath);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
