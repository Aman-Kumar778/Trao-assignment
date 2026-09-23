import { z } from "zod";

export const MetaTagSchema = z.object({
  origin: z.enum(["generated", "user_added", "user_edited"]),
  generation_batch: z.number().int()
}).optional();

export const KitSourceSchema = z.object({
  company: z.string(),
  company_url: z.string(),
  role: z.string(),
  location: z.string(),
  jd_chars: z.number().int(),
  researched_at: z.string(),
  pages_used: z.array(z.string())
});

export const CompanyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string()),
  _meta: MetaTagSchema
});

export const RequirementSchema = z.object({
  id: z.string(),
  text: z.string(),
  kind: z.enum(["technical", "behavioural", "domain"]),
  priority: z.enum(["must", "nice"]),
  _meta: MetaTagSchema
});

export const RoleInfoSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementSchema),
  _meta: MetaTagSchema
});

export const QuestionSchema = z.object({
  id: z.string(),
  requirement_ids: z.array(z.string()),
  category: z.enum(["technical", "behavioural", "system-design", "company-fit"]),
  prompt: z.string(),
  answer_outline: z.string(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  _meta: MetaTagSchema
});

export const FlashcardSchema = z.object({
  id: z.string(),
  front: z.string(),
  back: z.string(),
  requirement_ids: z.array(z.string()),
  confidence: z.number().int().min(0).max(5).optional(),
  _meta: MetaTagSchema
});

export const ScheduleDaySchema = z.object({
  day: z.number().int().positive(),
  focus: z.string(),
  question_ids: z.array(z.string()),
  minutes: z.number().int().nonnegative()
});

export const ScheduleSchema = z.object({
  days_available: z.number().int().positive(),
  days: z.array(ScheduleDaySchema),
  _meta: MetaTagSchema
}).refine((data) => data.days.length === data.days_available, {
  message: "schedule.days.length must equal days_available"
});

export const CoverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number().int().nonnegative()
});

export const KitSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().optional(),
  source: KitSourceSchema,
  company_brief: CompanyBriefSchema,
  role: RoleInfoSchema,
  questions: z.array(QuestionSchema),
  flashcards: z.array(FlashcardSchema),
  schedule: ScheduleSchema,
  coverage: CoverageSchema,
  created_at: z.string().optional(),
  updated_at: z.string().optional()
}).superRefine((data, ctx) => {
  const reqIds = new Set(data.role.requirements.map((r) => r.id));
  const questionIds = new Set(data.questions.map((q) => q.id));

  // Every question requirement_ids must reference an existing requirement
  data.questions.forEach((q, idx) => {
    q.requirement_ids.forEach((rid) => {
      if (!reqIds.has(rid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Question '${q.id}' references non-existent requirement_id '${rid}'`,
          path: ["questions", idx, "requirement_ids"]
        });
      }
    });
  });

  // Every flashcard requirement_ids must reference an existing requirement
  data.flashcards.forEach((f, idx) => {
    f.requirement_ids.forEach((rid) => {
      if (!reqIds.has(rid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Flashcard '${f.id}' references non-existent requirement_id '${rid}'`,
          path: ["flashcards", idx, "requirement_ids"]
        });
      }
    });
  });

  // Every schedule day question_ids must reference an existing question
  data.schedule.days.forEach((day, idx) => {
    day.question_ids.forEach((qid) => {
      if (!questionIds.has(qid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Schedule day ${day.day} references non-existent question_id '${qid}'`,
          path: ["schedule", "days", idx, "question_ids"]
        });
      }
    });
  });
});

export const BatchCaseSchema = z.object({
  id: z.string(),
  jd: z.string(),
  company_url: z.string(),
  days: z.number().int().positive()
});

export const BatchInputSchema = z.array(BatchCaseSchema);
