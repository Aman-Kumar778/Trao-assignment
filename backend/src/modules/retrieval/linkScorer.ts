const KEYWORD_WEIGHTS: Record<string, number> = {
  careers: 10,
  career: 10,
  jobs: 10,
  job: 10,
  hiring: 9,
  "join-us": 9,
  join: 8,
  culture: 7,
  team: 6,
  about: 5,
  "about-us": 5,
  engineering: 5,
  tech: 4,
  blog: 3,
  life: 3
};

export function scoreLink(urlOrHref: string, anchorText: string = ""): number {
  const combined = `${urlOrHref} ${anchorText}`.toLowerCase();
  let score = 0;

  for (const [kw, weight] of Object.entries(KEYWORD_WEIGHTS)) {
    if (combined.includes(kw)) {
      score += weight;
    }
  }

  // Penalty for common irrelevant patterns
  if (/\b(privacy|terms|login|signup|signin|help|faq|support|cookie)\b/i.test(combined)) {
    score -= 15;
  }

  return Math.max(0, score);
}

export function resolveUrl(baseUrl: string, href: string): string | null {
  try {
    // Strip hash fragments
    const cleanedHref = href.split("#")[0];
    if (!cleanedHref) return null;

    const resolved = new URL(cleanedHref, baseUrl);

    // Only allow http and https
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return null;
    }

    return resolved.href;
  } catch {
    return null;
  }
}
