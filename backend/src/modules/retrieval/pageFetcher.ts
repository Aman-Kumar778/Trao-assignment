import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { validateUrl } from "./urlValidator";
import { logger } from "../../lib/logger";

export interface DiscoveredLink {
  href: string;
  anchorText: string;
}

export interface FetchedPage {
  url: string;
  text: string;
  links: DiscoveredLink[];
}

export async function fetchPage(url: string, timeoutMs = 5000): Promise<FetchedPage> {
  const validation = validateUrl(url);
  if (!validation.valid) {
    throw new Error(`URL validation failed for '${url}': ${validation.reason}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal as any,
      headers: {
        "User-Agent": "TraqBot/1.0 (+https://traq-interview-prep.internal)"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error(`Invalid content-type '${contentType}'. Only HTML is supported.`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 2 * 1024 * 1024) {
      throw new Error(`Response size exceeds max limit of 2MB.`);
    }

    const html = await response.text();
    if (html.length > 2 * 1024 * 1024) {
      throw new Error(`HTML content length exceeds max limit of 2MB.`);
    }

    const $ = cheerio.load(html);

    // Extract links before stripping nav/footer
    const links: DiscoveredLink[] = [];
    $("a[href]").each((_, elem) => {
      const href = $(elem).attr("href");
      const anchorText = $(elem).text().trim();
      if (href) {
        links.push({ href: href.trim(), anchorText });
      }
    });

    // Strip unneeded noise elements
    $("script, style, nav, footer, header, svg, iframe, noscript").remove();

    // Clean text
    const rawText = $("body").text() || $.text();
    const cleanedText = rawText
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();

    return {
      url,
      text: cleanedText,
      links
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms for '${url}'`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
