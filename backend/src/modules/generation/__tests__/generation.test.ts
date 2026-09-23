import { extractRequirements } from "../../extraction";
import { generateCompanyBrief } from "../index";
import * as llm from "../../../lib/llm";

// Mock the LLM call to test deterministic behavior
jest.mock("../../../lib/llm", () => {
  const original = jest.requireActual("../../../lib/llm");
  return {
    ...original,
    callLLMJSON: jest.fn()
  };
});

describe("LLM Extraction & Generation Unit Tests", () => {
  const mockCallLLMJSON = llm.callLLMJSON as jest.MockedFunction<typeof llm.callLLMJSON>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Requirement Extraction", () => {
    it("should extract requirements accurately without padding thin JDs", async () => {
      mockCallLLMJSON.mockResolvedValueOnce({
        title: "React Developer",
        seniority: "Senior",
        responsibilities: ["Build UI components"],
        requirements: [
          { text: "5+ years React required", kind: "technical", priority: "must" },
          { text: "TypeScript experience a plus", kind: "technical", priority: "nice" }
        ]
      });

      const thinJD = "Senior React Developer. Required: 5+ years React. TypeScript is a plus.";
      const result = await extractRequirements(thinJD);

      expect(result.title).toBe("React Developer");
      expect(result.requirements).toHaveLength(2);
      expect(result.requirements[0].id).toBe("r1");
      expect(result.requirements[0].priority).toBe("must");
      expect(result.requirements[1].id).toBe("r2");
      expect(result.requirements[1].priority).toBe("nice");
    });
  });

  describe("Company Brief Generation", () => {
    it("should return explicit fallback message when pagesUsed is empty", async () => {
      const result = await generateCompanyBrief([], "Some JD text");
      expect(result.summary).toContain("No company website information could be retrieved");
      expect(result.sources).toEqual([]);
      expect(mockCallLLMJSON).not.toHaveBeenCalled();
    });
  });
});
