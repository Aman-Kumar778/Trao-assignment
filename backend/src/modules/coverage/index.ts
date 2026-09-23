import { Requirement, Question } from "@traq/shared";

export function checkCoverage(requirements: Requirement[], questions: Question[]): string[] {
  const coveredReqIds = new Set<string>();

  for (const q of questions) {
    for (const rid of q.requirement_ids) {
      coveredReqIds.add(rid);
    }
  }

  const uncovered: string[] = [];

  for (const req of requirements) {
    if (req.priority === "must" && !coveredReqIds.has(req.id)) {
      uncovered.push(req.id);
    }
  }

  return uncovered;
}

export interface CoverageLoopResult {
  questions: Question[];
  uncovered_requirement_ids: string[];
  passes: number;
}

export async function runCoverageLoop(
  requirements: Requirement[],
  initialQuestions: Question[],
  generateGapQuestionsFn: (gappedReqs: Requirement[]) => Promise<Question[]>
): Promise<CoverageLoopResult> {
  let questions = [...initialQuestions];
  let passes = 1;
  const maxPasses = 3;

  let uncovered = checkCoverage(requirements, questions);

  while (uncovered.length > 0 && passes < maxPasses) {
    passes++;

    // Find gapped requirements objects
    const gappedReqs = requirements.filter((r) => uncovered.includes(r.id));
    if (gappedReqs.length === 0) break;

    const gapQuestions = await generateGapQuestionsFn(gappedReqs);
    if (!gapQuestions || gapQuestions.length === 0) {
      break;
    }

    questions = [...questions, ...gapQuestions];
    uncovered = checkCoverage(requirements, questions);
  }

  return {
    questions,
    uncovered_requirement_ids: uncovered,
    passes
  };
}
