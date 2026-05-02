import * as zlib from "zlib";

export interface SkillFrontmatter {
  name?: string;
  description?: string;
  "argument-hint"?: string;
  "user-invocable"?: boolean;
  workflow_stage?: string;
  platform?: string;
  compatibility?: string;
  tags?: string[];
}

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
}

export function parseSkillMd(content: string): ParsedSkill {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const fm: SkillFrontmatter = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, "");
    (fm as any)[key] = val === "true" ? true : val === "false" ? false : val;
  }

  return { frontmatter: fm, body: match[2].trim() };
}

export function extractSkillFromZip(buf: Buffer): ParsedSkill | null {
  // ZIP local file header: PK\x03\x04
  let offset = 0;
  while (offset < buf.length - 30) {
    if (buf[offset] !== 0x50 || buf[offset + 1] !== 0x4b || buf[offset + 2] !== 0x03 || buf[offset + 3] !== 0x04) {
      offset++;
      continue;
    }
    const compression = buf.readUInt16LE(offset + 8);
    const compressedSize = buf.readUInt32LE(offset + 18);
    const filenameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const filename = buf.slice(offset + 30, offset + 30 + filenameLen).toString("utf8");
    const dataStart = offset + 30 + filenameLen + extraLen;
    const dataEnd = dataStart + compressedSize;

    if (filename.endsWith("SKILL.md")) {
      const compressed = buf.slice(dataStart, dataEnd);
      const raw = compression === 0 ? compressed : zlib.inflateRawSync(compressed);
      return parseSkillMd(raw.toString("utf8", undefined, undefined));
    }
    offset = dataEnd;
  }
  return null;
}
