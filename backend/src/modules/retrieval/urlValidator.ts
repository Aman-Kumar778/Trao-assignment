import { env } from "../../config/env";

export function validateUrl(urlString: string): { valid: boolean; reason?: string } {
  if (!urlString || typeof urlString !== "string") {
    return { valid: false, reason: "URL string is missing or empty" };
  }

  const trimmed = urlString.trim();

  if (trimmed.toLowerCase().startsWith("file://")) {
    return { valid: false, reason: "file:// protocol is strictly forbidden" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: "Malformed URL format" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: `Unsupported protocol '${parsed.protocol}'` };
  }

  const hostname = parsed.hostname.toLowerCase();
  const isDevOrTest = env.NODE_ENV === "development" || env.NODE_ENV === "test";

  // Check localhost / loopback IPs
  const isLoopback =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost");

  if (isLoopback) {
    if (isDevOrTest) {
      return { valid: true };
    }
    return { valid: false, reason: "Loopback addresses are forbidden in production" };
  }

  // Check private IP ranges in production
  if (!isDevOrTest) {
    const isPrivate =
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      /^169\.254\./.test(hostname);

    if (isPrivate) {
      return { valid: false, reason: "Private network IP ranges are forbidden in production" };
    }
  }

  return { valid: true };
}
