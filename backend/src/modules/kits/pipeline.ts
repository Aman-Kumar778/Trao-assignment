import { Kit, Question, Requirement } from "@traq/shared";
import { crawlCompanySite, searchPublicDiscussion } from "../retrieval";
import { extractRequirements } from "../extraction";
import {
  generateCompanyBrief,
  generateQuestionsForCategory,
  generateFlashcards
} from "../generation";
import { runCoverageLoop } from "../coverage";
import { buildSchedule } from "../scheduling";
import { assembleKit, validateKit } from "./kitAssembler";
import { logger } from "../../lib/logger";

export interface PipelineOptions {
  onProgress?: (stage: string) => void;
}

export async function runPipeline(
  jd: string,
  companyUrl: string,
  daysAvailable: number,
  options: PipelineOptions = {}
): Promise<Kit> {
  const notify = (stage: string) => {
    logger.info(`[Pipeline Stage] ${stage}`);
    if (options.onProgress) options.onProgress(stage);
  };

  // Step 1: Extract Requirements from JD
  notify("Extracting requirements from job description...");
  const roleData = await extractRequirements(jd);

  // Step 2: Crawl Company Site
  notify("Crawling company site and career pages...");
  let pagesUsed: any[] = [];
  let companyName = roleData.title || "Company";
  try {
    const crawlRes = await crawlCompanySite(companyUrl);
    pagesUsed = crawlRes.pagesUsed;
    if (pagesUsed.length > 0) {
      try {
        companyName = new URL(companyUrl).hostname.replace(/^www\./, "").split(".")[0];
      } catch {
        // fallback
      }
    }
  } catch (err) {
    logger.warn(`Company crawl encountered non-fatal error:`, err);
  }

  // Step 3: Search Public Discussion
  notify("Searching public discussion of interview process...");
  const discussionContext = await searchPublicDiscussion(companyName);

  // Step 4: Generate Company Brief
  notify("Generating company brief...");
  const companyBrief = await generateCompanyBrief(pagesUsed, jd);

  // Step 5: Category-Specific Question Generation
  notify("Generating category-specific question bank...");
  const categories: ("technical" | "behavioural" | "system-design" | "company-fit")[] = [
    "technical",
    "behavioural",
    "system-design",
    "company-fit"
  ];

  let initialQuestions: Question[] = [];
  for (const cat of categories) {
    notify(`Generating ${cat} questions...`);
    const qList = await generateQuestionsForCategory(roleData.requirements, cat, discussionContext);
    initialQuestions = [...initialQuestions, ...qList];
  }

  // Step 6: Pure Coverage Loop
  notify("Performing programmatic coverage check...");
  const coverageLoopRes = await runCoverageLoop(
    roleData.requirements,
    initialQuestions,
    async (gappedReqs: Requirement[]) => {
      notify(`Gap fill: generating targeted questions for ${gappedReqs.length} uncovered must-requirements...`);
      return generateQuestionsForCategory(gappedReqs, "technical", discussionContext);
    }
  );

  const finalQuestions = coverageLoopRes.questions;

  // Step 7: Generate Flashcards
  notify("Generating revision flashcards...");
  const flashcards = await generateFlashcards(finalQuestions);

  // Step 8: Build Schedule (Pure Algorithm)
  notify("Building optimal study schedule...");
  const schedule = buildSchedule(roleData.requirements, finalQuestions, daysAvailable);

  // Step 9: Assemble Source & Final Kit
  const source = {
    company: companyName,
    company_url: companyUrl || "",
    role: roleData.title,
    location: "Remote / Unspecified",
    jd_chars: jd.length,
    researched_at: new Date().toISOString(),
    pages_used: pagesUsed.map((p) => p.url)
  };

  const kit = assembleKit(
    source,
    companyBrief,
    roleData,
    finalQuestions,
    flashcards,
    schedule,
    {
      uncovered_requirement_ids: coverageLoopRes.uncovered_requirement_ids,
      passes: coverageLoopRes.passes
    }
  );

  // Step 10: Validate Kit Contract
  notify("Validating kit schema contract...");
  const validation = validateKit(kit);
  if (!validation.valid) {
    logger.warn("Kit validation warnings:", validation.errors);
  }

  return kit;
}
