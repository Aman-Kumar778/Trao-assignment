import fetch from "node-fetch";
import robotsParser from "robots-parser";
import { fetchPage, FetchedPage } from "./pageFetcher";
import { scoreLink, resolveUrl } from "./linkScorer";
import { logger } from "../../lib/logger";

export interface CrawlPageResult {
  url: string;
  text: string;
}

export interface SkippedPageResult {
  url: string;
  reason: string;
}

export interface CrawlResult {
  pagesUsed: CrawlPageResult[];
  skipped: SkippedPageResult[];
}

export async function fetchRobotsTxt(baseUrl: string): Promise<any> {
  try {
    const origin = new URL(baseUrl).origin;
    const robotsUrl = `${origin}/robots.txt`;
    const res = await fetch(robotsUrl, { timeout: 3000 } as any);
    if (res.ok) {
      const text = await res.text();
      return robotsParser(robotsUrl, text);
    }
  } catch {
    // Ignore errors fetching robots.txt
  }
  return robotsParser("", "");
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function crawlCompanySite(
  companyUrl: string,
  maxPages = 15,
  maxDepth = 2
): Promise<CrawlResult> {
  const pagesUsed: CrawlPageResult[] = [];
  const skipped: SkippedPageResult[] = [];
  const visited = new Set<string>();

  let initialUrl: string;
  try {
    const parsed = new URL(companyUrl);
    initialUrl = parsed.href;
  } catch {
    skipped.push({ url: companyUrl, reason: "Invalid company URL format" });
    return { pagesUsed, skipped };
  }

  const robots = await fetchRobotsTxt(initialUrl);

  // BFS Queue item
  interface QueueItem {
    url: string;
    depth: number;
  }

  const queue: QueueItem[] = [{ url: initialUrl, depth: 0 }];
  visited.add(initialUrl);

  while (queue.length > 0 && pagesUsed.length < maxPages) {
    const current = queue.shift()!;

    // Check robots.txt
    if (robots && typeof robots.isAllowed === "function") {
      const allowed = robots.isAllowed(current.url, "TraqBot");
      if (allowed === false) {
        skipped.push({ url: current.url, reason: "Disallowed by robots.txt" });
        continue;
      }
    }

    // Rate limiting delay (1 req/sec)
    await sleep(1000);

    // Fetch page with exponential backoff on 429/5xx (max 3 retries)
    let page: FetchedPage | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        page = await fetchPage(current.url);
        break;
      } catch (err: any) {
        const errorMsg = err.message || String(err);
        if ((errorMsg.includes("429") || errorMsg.includes("500") || errorMsg.includes("503")) && attempts < maxAttempts) {
          const backoff = Math.pow(2, attempts) * 1000;
          logger.warn(`Retrying '${current.url}' (attempt ${attempts}) in ${backoff}ms...`);
          await sleep(backoff);
        } else {
          skipped.push({ url: current.url, reason: errorMsg });
          break;
        }
      }
    }

    if (!page) {
      continue;
    }

    pagesUsed.push({
      url: page.url,
      text: page.text
    });

    // If we haven't reached max depth, collect and score links
    if (current.depth < maxDepth) {
      const candidates: { url: string; score: number }[] = [];

      for (const link of page.links) {
        const resolved = resolveUrl(page.url, link.href);
        if (!resolved || visited.has(resolved)) continue;

        // Ensure same origin or relative domain path
        try {
          const targetParsed = new URL(resolved);
          const currentParsed = new URL(page.url);
          if (targetParsed.hostname !== currentParsed.hostname) {
            continue; // Skip external domains during company site crawl
          }
        } catch {
          continue;
        }

        const score = scoreLink(resolved, link.anchorText);
        if (score > 0) {
          candidates.push({ url: resolved, score });
        }
      }

      // Sort candidates by score descending
      candidates.sort((a, b) => b.score - a.score);

      for (const candidate of candidates) {
        if (!visited.has(candidate.url)) {
          visited.add(candidate.url);
          queue.push({ url: candidate.url, depth: current.depth + 1 });
        }
      }
    }
  }

  return { pagesUsed, skipped };
}
