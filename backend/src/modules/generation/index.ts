import { callLLMJSON } from "../../lib/llm";
import {
  CompanyBrief,
  Question,
  Flashcard,
  QuestionCategory,
  QuestionDifficulty,
  Requirement
} from "@traq/shared";
import { CrawlPageResult, TavilySearchResult } from "../retrieval";

export async function generateCompanyBrief(
  pagesUsed: CrawlPageResult[],
  jdText: string
): Promise<CompanyBrief> {
  const sources = pagesUsed.map((p) => p.url);

  if (pagesUsed.length === 0) {
    return {
      summary: "No company website information could be retrieved during crawling. Brief is generated solely from job description context.",
      what_they_do: "Company domain details unavailable.",
      sources: [],
      _meta: {
        origin: "generated",
        generation_batch: 1
      }
    };
  }

  // Combine fetched text snippets up to 8,000 chars to avoid prompt bloat
  const combinedSiteText = pagesUsed
    .map((p) => `URL: ${p.url}\nCONTENT: ${p.text.slice(0, 1500)}`)
    .join("\n\n")
    .slice(0, 8000);

  const systemPrompt = `You are a corporate intelligence analyst.
Summarize company information using ONLY the provided website text data.

STRICT RULES:
1. DO NOT fabricate facts, employee counts, tech stacks, or business models not supported by the data.
2. If text is missing or sparse, state so honestly.

RETURN VALID JSON:
{
  "summary": "2-3 sentence overview",
  "what_they_do": "Clear description of product/services"
}`;

  const userPrompt = `<data>\n${combinedSiteText}\n\nJOB CONTEXT:\n${jdText.slice(0, 1000)}\n</data>`;

  try {
    const result = await callLLMJSON<any>({
      systemPrompt,
      userPrompt,
      temperature: 0.2
    });

    return {
      summary: String(result.summary || "Summary generated from company sources.").trim(),
      what_they_do: String(result.what_they_do || "Company operations overview.").trim(),
      sources,
      _meta: {
        origin: "generated",
        generation_batch: 1
      }
    };
  } catch {
    return {
      summary: "Company brief generated from website context.",
      what_they_do: "Information extracted from public company pages.",
      sources,
      _meta: {
        origin: "generated",
        generation_batch: 1
      }
    };
  }
}

export async function generateQuestionsForCategory(
  requirements: Requirement[],
  category: QuestionCategory,
  discussionContext: TavilySearchResult[] = []
): Promise<Question[]> {
  if (!requirements || requirements.length === 0) {
    return [];
  }

  const reqSummary = requirements.map((r) => `[ID: ${r.id}] (${r.priority.toUpperCase()} - ${r.kind}): ${r.text}`).join("\n");
  const discussionSummary = discussionContext.map((d) => `${d.title}: ${d.content.slice(0, 300)}`).join("\n");

  const categoryPrompts: Record<QuestionCategory, string> = {
    technical: "Focus heavily on coding principles, system architecture, language specific syntaxes, edge cases, and practical technical problem solving.",
    behavioural: "Focus on past experiences, conflict resolution, team collaboration, leadership, mistake ownership (STAR method outline).",
    "system-design": "Focus on high-level architecture, scalability, data modeling, API design, trade-offs, and reliability.",
    "company-fit": "Focus on company values, motivation, work environment preferences, and process alignment."
  };

  const systemPrompt = `You are an expert interviewer creating interview prep questions.
Category: "${category.toUpperCase()}"
Category Focus: ${categoryPrompts[category]}

INSTRUCTIONS:
1. Generate high-quality interview questions specifically mapping to one or more requirement IDs listed below.
2. For each question, provide:
   - "requirement_ids": array of linked requirement IDs (e.g. ["r1"])
   - "prompt": The exact question to ask
   - "answer_outline": Bulleted key points a successful candidate must cover
   - "difficulty": Integer 1 (Easy/Basic), 2 (Intermediate), or 3 (Advanced/Hard)
3. Ensure difficulty is an integer (1, 2, or 3).

RETURN VALID JSON matching this array structure:
{
  "questions": [
    {
      "requirement_ids": ["r1"],
      "prompt": "string",
      "answer_outline": "string",
      "difficulty": 1|2|3
    }
  ]
}`;

  const userPrompt = `REQUIREMENTS:\n${reqSummary}\n\nPUBLIC DISCUSSION INSIGHTS:\n${discussionSummary || "None available."}`;

  try {
    const result = await callLLMJSON<any>({
      systemPrompt,
      userPrompt,
      temperature: 0.3
    });

    const rawList = Array.isArray(result.questions) ? result.questions : [];
    const validReqIds = new Set(requirements.map((r) => r.id));

    return rawList.map((q: any, idx: number) => {
      let linkedIds: string[] = Array.isArray(q.requirement_ids)
        ? q.requirement_ids.filter((id: string) => validReqIds.has(id))
        : [];
      if (linkedIds.length === 0 && requirements.length > 0) {
        linkedIds = [requirements[0].id];
      }

      const diff = Math.min(3, Math.max(1, parseInt(q.difficulty, 10) || 2)) as QuestionDifficulty;

      return {
        id: `q_${category}_${idx + 1}`,
        requirement_ids: linkedIds,
        category,
        prompt: String(q.prompt || "").trim(),
        answer_outline: String(q.answer_outline || "").trim(),
        difficulty: diff,
        _meta: {
          origin: "generated",
          generation_batch: 1
        }
      };
    });
  } catch {
    return [];
  }
}

export async function generateFlashcards(questions: Question[]): Promise<Flashcard[]> {
  if (!questions || questions.length === 0) {
    return [];
  }

  const questionSummary = questions
    .map((q) => `[Q_ID: ${q.id}] [REQ_IDS: ${q.requirement_ids.join(",")}] Prompt: ${q.prompt}\nOutline: ${q.answer_outline}`)
    .join("\n\n");

  const systemPrompt = `You are a study card creator.
Convert the provided interview questions and answer outlines into concise, high-impact flashcards for rapid revision.

INSTRUCTIONS:
1. "front": Clear question or core concept trigger.
2. "back": Concise key answers, formula, or checklist (3-5 key points).
3. "requirement_ids": Preserve the requirement_ids array from the original question.

RETURN VALID JSON:
{
  "flashcards": [
    {
      "front": "string",
      "back": "string",
      "requirement_ids": ["r1"]
    }
  ]
}`;

  try {
    const result = await callLLMJSON<any>({
      systemPrompt,
      userPrompt: questionSummary,
      temperature: 0.2
    });

    const rawList = Array.isArray(result.flashcards) ? result.flashcards : [];
    return rawList.map((f: any, idx: number) => ({
      id: `f${idx + 1}`,
      front: String(f.front || "").trim(),
      back: String(f.back || "").trim(),
      requirement_ids: Array.isArray(f.requirement_ids) ? f.requirement_ids : (questions[0]?.requirement_ids || []),
      _meta: {
        origin: "generated",
        generation_batch: 1
      }
    }));
  } catch {
    // Fallback: generate 1:1 flashcards directly from questions
    return questions.map((q, idx) => ({
      id: `f${idx + 1}`,
      front: q.prompt,
      back: q.answer_outline,
      requirement_ids: q.requirement_ids,
      _meta: {
        origin: "generated",
        generation_batch: 1
      }
    }));
  }
}
