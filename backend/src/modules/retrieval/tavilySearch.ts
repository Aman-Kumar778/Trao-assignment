import fetch from "node-fetch";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
}

export async function searchPublicDiscussion(companyName: string): Promise<TavilySearchResult[]> {
  if (!companyName || !companyName.trim()) {
    return [];
  }

  if (!env.TAVILY_API_KEY) {
    logger.info("TAVILY_API_KEY not configured. Skipping public discussion search.");
    return [];
  }

  try {
    const query = `"${companyName.trim()}" interview process glassdoor OR blind OR reddit`;
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: env.TAVILY_API_KEY,
        query,
        search_depth: "basic",
        include_answer: false,
        max_results: 5
      }),
      timeout: 5000
    } as any);

    if (!response.ok) {
      logger.warn(`Tavily API returned status ${response.status}`);
      return [];
    }

    const data: any = await response.json();
    if (!data || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((r: any) => ({
      title: r.title || "",
      url: r.url || "",
      content: r.content || ""
    }));
  } catch (error) {
    logger.warn(`Tavily search failed for '${companyName}':`, error);
    return [];
  }
}
