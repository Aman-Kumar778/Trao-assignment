import { validateUrl } from "../urlValidator";
import { scoreLink, resolveUrl } from "../linkScorer";
import { crawlCompanySite, fetchRobotsTxt } from "../crawler";
import { startFixtureServer } from "@test-fixtures/server";
import http from "http";

describe("Retrieval Layer Unit Tests", () => {
  let server: http.Server;
  const PORT = 8099;
  const FIXTURE_URL = `http://localhost:${PORT}/`;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    server = await startFixtureServer(PORT);
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe("URL Validator", () => {
    it("should reject file:// URLs", () => {
      const res = validateUrl("file:///etc/passwd");
      expect(res.valid).toBe(false);
      expect(res.reason).toContain("file://");
    });

    it("should allow localhost in test environment", () => {
      const res = validateUrl("http://localhost:8099/careers");
      expect(res.valid).toBe(true);
    });

    it("should reject malformed URLs", () => {
      const res = validateUrl("not-a-valid-url");
      expect(res.valid).toBe(false);
    });
  });

  describe("Link Scorer & Resolver", () => {
    it("should score careers and jobs links higher than generic text", () => {
      const careerScore = scoreLink("/careers", "Join Our Team & Careers");
      const genericScore = scoreLink("/terms", "Terms of Service");
      expect(careerScore).toBeGreaterThan(genericScore);
    });

    it("should resolve relative URLs properly", () => {
      const resolved = resolveUrl("http://localhost:8099/about", "../careers");
      expect(resolved).toBe("http://localhost:8099/careers");
    });
  });

  describe("Robots.txt & Crawler", () => {
    it("should parse robots.txt and detect disallowed paths", async () => {
      const robots = await fetchRobotsTxt(FIXTURE_URL);
      const isSecretAllowed = robots.isAllowed(`${FIXTURE_URL}secret`, "TraqBot");
      const isCareersAllowed = robots.isAllowed(`${FIXTURE_URL}careers`, "TraqBot");
      expect(isSecretAllowed).toBe(false);
      expect(isCareersAllowed).toBe(true);
    });

    it("should crawl local fixture server, score links, and avoid secret path", async () => {
      const result = await crawlCompanySite(FIXTURE_URL, 5, 2);
      expect(result.pagesUsed.length).toBeGreaterThan(0);

      const crawledUrls = result.pagesUsed.map((p) => p.url);
      expect(crawledUrls).toContain(`${FIXTURE_URL}careers`);

      // Secret page should either be in skipped or not in pagesUsed
      expect(crawledUrls).not.toContain(`${FIXTURE_URL}secret`);
    }, 15000);
  });
});
