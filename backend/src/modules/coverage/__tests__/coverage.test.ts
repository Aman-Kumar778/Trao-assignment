import { checkCoverage, runCoverageLoop } from "../index";
import { Requirement, Question } from "@traq/shared";

describe("Coverage Module Unit Tests", () => {
  const reqs: Requirement[] = [
    { id: "r1", text: "React experience", kind: "technical", priority: "must" },
    { id: "r2", text: "Node.js experience", kind: "technical", priority: "must" },
    { id: "r3", text: "Docker knowledge", kind: "technical", priority: "nice" }
  ];

  it("should identify uncovered must requirements", () => {
    const questions: Question[] = [
      {
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Explain React hooks",
        answer_outline: "State and effect",
        difficulty: 2
      }
    ];

    const uncovered = checkCoverage(reqs, questions);
    expect(uncovered).toEqual(["r2"]); // r1 is covered, r3 is nice (not must)
  });

  it("should run coverage loop up to max 3 passes and stop when covered", async () => {
    const initialQuestions: Question[] = [
      {
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "React question",
        answer_outline: "Outline",
        difficulty: 1
      }
    ];

    const mockGapFiller = jest.fn().mockResolvedValue([
      {
        id: "q2",
        requirement_ids: ["r2"],
        category: "technical",
        prompt: "Node.js question",
        answer_outline: "Outline",
        difficulty: 2
      }
    ]);

    const result = await runCoverageLoop(reqs, initialQuestions, mockGapFiller);

    expect(result.passes).toBe(2);
    expect(result.uncovered_requirement_ids).toEqual([]);
    expect(result.questions).toHaveLength(2);
    expect(mockGapFiller).toHaveBeenCalledTimes(1);
  });
});
