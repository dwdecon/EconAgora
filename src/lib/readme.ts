export interface TocItem {
  text: string;
  slug: string;
  level: number;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const seenSlugs = new Map<string, number>();
  const lines = markdown.split("\n");

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawText = match[2].trim().replace(/\s+#+$/, "");
      const text = stripInlineMarkdown(rawText);
      let slug = slugify(text);
      if (!slug) slug = `heading-${items.length + 1}`;

      const count = seenSlugs.get(slug) ?? 0;
      seenSlugs.set(slug, count + 1);
      if (count > 0) {
        slug = `${slug}-${count + 1}`;
      }

      items.push({ text, slug, level });
    }
  }

  return items;
}

export function splitMarkdownBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const lines = markdown.split("\n");
  let current: string[] = [];
  let inCodeBlock = false;
  let codeFence: string | null = null;

  for (const line of lines) {
    const fenceMatch = line.match(/^(`{3,}|~{3,})/);

    if (fenceMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeFence = fenceMatch[1];
      } else if (fenceMatch[1] === codeFence) {
        inCodeBlock = false;
        codeFence = null;
      }
    }

    if (line === "" && !inCodeBlock) {
      if (current.length > 0) {
        blocks.push(current.join("\n"));
        current = [];
      }
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    blocks.push(current.join("\n"));
  }

  return blocks.filter((b) => b.trim().length > 0);
}

export function generateSummary(
  markdown: string,
  targetChars: number = 1000,
): { summary: string; isTruncated: boolean } {
  const blocks = splitMarkdownBlocks(markdown);

  if (markdown.length < 800) {
    return { summary: markdown, isTruncated: false };
  }

  let charCount = 0;
  let foundFirstHeading = false;
  let foundFirstParagraph = false;
  const selected: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const isH1OrH2 = /^#{1,2}\s/.test(block);
    const isParagraph =
      !/^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.|^```|^---+|^\*\*\*|^___|^\s*>/.test(block) && block.length > 0;

    const isFirstHeading = isH1OrH2 && !foundFirstHeading;
    const isFirstParagraphBlock = isParagraph && !foundFirstParagraph;

    if (isH1OrH2) foundFirstHeading = true;
    if (isFirstParagraphBlock) foundFirstParagraph = true;

    const guaranteeMet = foundFirstHeading && foundFirstParagraph;
    const wouldExceed = charCount + block.length > targetChars;

    const mustInclude = isFirstHeading || isFirstParagraphBlock;
    if (!mustInclude && guaranteeMet && wouldExceed && selected.length > 0) {
      if (block.length > targetChars) {
        selected.push(block);
        charCount += block.length;
      }
      break;
    }

    selected.push(block);
    charCount += block.length;
  }

  const summary = selected.join("\n\n");
  return { summary, isTruncated: summary.length < markdown.length };
}
