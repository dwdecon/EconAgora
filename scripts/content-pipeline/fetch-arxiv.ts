#!/usr/bin/env tsx
/**
 * Fetch recent economics papers from arXiv RSS
 *
 * Usage:
 *   tsx scripts/content-pipeline/fetch-arxiv.ts [days_back]
 *
 * Filters for AI/ML relevant papers in economics
 */

const ARXIV_RSS_URL = "https://rss.arxiv.org/rss/econ.EM";
const CS_ECON_RSS_URL = "https://rss.arxiv.org/rss/cs.ECON";
const QFIN_RSS_URL = "https://rss.arxiv.org/rss/q-fin.EC";

interface ArxivPaper {
  title: string;
  link: string;
  abstract: string;
  authors: string[];
  published: string;
  categories: string[];
  aiRelevance: number;
}

/**
 * Simple XML to object parser (no external dependency)
 */
function parseXML(xml: string): any {
  const result: any = {};

  // Extract items
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const items: any[] = [];
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const item: any = {};

    // Extract fields
    const fields = ["title", "link", "description", "pubDate"];
    for (const field of fields) {
      const fieldMatch = itemXml.match(new RegExp(`<${field}>([\\s\\S]*?)<\\/${field}>`));
      if (fieldMatch) {
        item[field] = fieldMatch[1].trim();
      }
    }

    // Extract authors
    const authorMatches = itemXml.match(/<author>([<>]*?)<\/author>/g);
    if (authorMatches) {
      item.author = authorMatches.map((a) =>
        a.replace(/<\/?author>/g, "").trim()
      );
    }

    // Extract categories
    const catMatches = itemXml.match(/<category>([<>]*?)<\/category>/g);
    if (catMatches) {
      item.category = catMatches.map((c) =>
        c.replace(/<\/?category>/g, "").trim()
      );
    }

    items.push(item);
  }

  return { rss: { channel: [{ item: items }] } };
}

async function fetchRSS(url: string): Promise<ArxivPaper[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "EconAgora-Bot/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    const parsed = parseXML(xml);

    const items = parsed.rss?.channel?.[0]?.item || [];
    const papers: ArxivPaper[] = [];

    for (const item of items) {
      const title = item.title?.trim() || "";
      const link = item.link || "";
      const abstract = item.description?.trim() || "";
      const authors = item.author || [];
      const published = item.pubDate || "";
      const categories = item.category || [];

      // Calculate AI relevance score
      const aiKeywords = [
        "machine learning",
        "artificial intelligence",
        "deep learning",
        "neural network",
        "LLM",
        "large language model",
        "GPT",
        "Claude",
        "AI",
        "automation",
        "prediction",
        "causal inference",
        "treatment effect",
        "DID",
        "difference-in-differences",
        "instrumental variable",
        "regression discontinuity",
        "synthetic control",
        "text analysis",
        "NLP",
        "natural language processing",
      ];

      const text = `${title} ${abstract}`.toLowerCase();
      let aiRelevance = 0;
      for (const keyword of aiKeywords) {
        if (text.includes(keyword.toLowerCase())) {
          aiRelevance += 1;
        }
      }

      papers.push({
        title,
        link,
        abstract,
        authors,
        published,
        categories,
        aiRelevance,
      });
    }

    return papers;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return [];
  }
}

async function fetchAllPapers(daysBack: number = 7): Promise<ArxivPaper[]> {
  console.log(`Fetching arXiv papers (last ${daysBack} days)...`);

  const [econPapers, csPapers, qfinPapers] = await Promise.all([
    fetchRSS(ARXIV_RSS_URL),
    fetchRSS(CS_ECON_RSS_URL),
    fetchRSS(QFIN_RSS_URL),
  ]);

  const allPapers = [...econPapers, ...csPapers, ...qfinPapers];

  // Filter by date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const recentPapers = allPapers.filter((paper) => {
    const paperDate = new Date(paper.published);
    return paperDate >= cutoffDate;
  });

  // Sort by AI relevance
  recentPapers.sort((a, b) => b.aiRelevance - a.aiRelevance);

  return recentPapers;
}

// CLI entry
if (require.main === module) {
  const daysBack = parseInt(process.argv[2]) || 7;

  fetchAllPapers(daysBack)
    .then((papers) => {
      console.log(`\nFound ${papers.length} recent papers\n`);

      for (const paper of papers.slice(0, 10)) {
        console.log(`Title: ${paper.title}`);
        console.log(`Link: ${paper.link}`);
        console.log(`AI Relevance: ${paper.aiRelevance}`);
        console.log(`Published: ${paper.published}`);
        console.log(`Abstract: ${paper.abstract.slice(0, 200)}...`);
        console.log("---");
      }
    })
    .catch(console.error);
}

export { fetchAllPapers, ArxivPaper };
