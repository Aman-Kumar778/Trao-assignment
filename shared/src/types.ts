export type RequirementKind = "technical" | "behavioural" | "domain";
export type RequirementPriority = "must" | "nice";

export type QuestionCategory = "technical" | "behavioural" | "system-design" | "company-fit";
export type QuestionDifficulty = 1 | 2 | 3;

export type OriginType = "generated" | "user_added" | "user_edited";

export interface MetaTag {
  origin: OriginType;
  generation_batch: number;
}

export interface KitSource {
  company: string;
  company_url: string;
  role: string;
  location: string;
  jd_chars: number;
  researched_at: string;
  pages_used: string[];
}

export interface CompanyBrief {
  summary: string;
  what_they_do: string;
  sources: string[];
  _meta?: MetaTag;
}

export interface Requirement {
  id: string;
  text: string;
  kind: RequirementKind;
  priority: RequirementPriority;
  _meta?: MetaTag;
}

export interface RoleInfo {
  title: string;
  seniority: string;
  responsibilities: string[];
  requirements: Requirement[];
  _meta?: MetaTag;
}

export interface Question {
  id: string;
  requirement_ids: string[];
  category: QuestionCategory;
  prompt: string;
  answer_outline: string;
  difficulty: QuestionDifficulty;
  _meta?: MetaTag;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  confidence?: number; // 1-5 or 0 for unpracticed
  _meta?: MetaTag;
}

export interface ScheduleDay {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number;
}

export interface Schedule {
  days_available: number;
  days: ScheduleDay[];
  _meta?: MetaTag;
}

export interface Coverage {
  uncovered_requirement_ids: string[];
  passes: number;
}

export interface Kit {
  id?: string;
  user_id?: string;
  source: KitSource;
  company_brief: CompanyBrief;
  role: RoleInfo;
  questions: Question[];
  flashcards: Flashcard[];
  schedule: Schedule;
  coverage: Coverage;
  created_at?: string;
  updated_at?: string;
}

// Appendix B Batch CLI types
export interface BatchCase {
  id: string;
  jd: string;
  company_url: string;
  days: number;
}

export interface BatchKitResult {
  id: string;
  status: "ok" | "failed";
  kit: Kit | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export interface BatchOutput {
  version: string;
  generated_at: string;
  kits: BatchKitResult[];
}
