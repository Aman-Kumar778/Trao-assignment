"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchInputSchema = exports.BatchCaseSchema = exports.KitSchema = exports.CoverageSchema = exports.ScheduleSchema = exports.ScheduleDaySchema = exports.FlashcardSchema = exports.QuestionSchema = exports.RoleInfoSchema = exports.RequirementSchema = exports.CompanyBriefSchema = exports.KitSourceSchema = exports.MetaTagSchema = void 0;
const zod_1 = require("zod");
exports.MetaTagSchema = zod_1.z.object({
    origin: zod_1.z.enum(["generated", "user_added", "user_edited"]),
    generation_batch: zod_1.z.number().int()
}).optional();
exports.KitSourceSchema = zod_1.z.object({
    company: zod_1.z.string(),
    company_url: zod_1.z.string(),
    role: zod_1.z.string(),
    location: zod_1.z.string(),
    jd_chars: zod_1.z.number().int(),
    researched_at: zod_1.z.string(),
    pages_used: zod_1.z.array(zod_1.z.string())
});
exports.CompanyBriefSchema = zod_1.z.object({
    summary: zod_1.z.string(),
    what_they_do: zod_1.z.string(),
    sources: zod_1.z.array(zod_1.z.string()),
    _meta: exports.MetaTagSchema
});
exports.RequirementSchema = zod_1.z.object({
    id: zod_1.z.string(),
    text: zod_1.z.string(),
    kind: zod_1.z.enum(["technical", "behavioural", "domain"]),
    priority: zod_1.z.enum(["must", "nice"]),
    _meta: exports.MetaTagSchema
});
exports.RoleInfoSchema = zod_1.z.object({
    title: zod_1.z.string(),
    seniority: zod_1.z.string(),
    responsibilities: zod_1.z.array(zod_1.z.string()),
    requirements: zod_1.z.array(exports.RequirementSchema),
    _meta: exports.MetaTagSchema
});
exports.QuestionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    requirement_ids: zod_1.z.array(zod_1.z.string()),
    category: zod_1.z.enum(["technical", "behavioural", "system-design", "company-fit"]),
    prompt: zod_1.z.string(),
    answer_outline: zod_1.z.string(),
    difficulty: zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2), zod_1.z.literal(3)]),
    _meta: exports.MetaTagSchema
});
exports.FlashcardSchema = zod_1.z.object({
    id: zod_1.z.string(),
    front: zod_1.z.string(),
    back: zod_1.z.string(),
    requirement_ids: zod_1.z.array(zod_1.z.string()),
    confidence: zod_1.z.number().int().min(0).max(5).optional(),
    _meta: exports.MetaTagSchema
});
exports.ScheduleDaySchema = zod_1.z.object({
    day: zod_1.z.number().int().positive(),
    focus: zod_1.z.string(),
    question_ids: zod_1.z.array(zod_1.z.string()),
    minutes: zod_1.z.number().int().nonnegative()
});
exports.ScheduleSchema = zod_1.z.object({
    days_available: zod_1.z.number().int().positive(),
    days: zod_1.z.array(exports.ScheduleDaySchema),
    _meta: exports.MetaTagSchema
}).refine((data) => data.days.length === data.days_available, {
    message: "schedule.days.length must equal days_available"
});
exports.CoverageSchema = zod_1.z.object({
    uncovered_requirement_ids: zod_1.z.array(zod_1.z.string()),
    passes: zod_1.z.number().int().nonnegative()
});
exports.KitSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    user_id: zod_1.z.string().optional(),
    source: exports.KitSourceSchema,
    company_brief: exports.CompanyBriefSchema,
    role: exports.RoleInfoSchema,
    questions: zod_1.z.array(exports.QuestionSchema),
    flashcards: zod_1.z.array(exports.FlashcardSchema),
    schedule: exports.ScheduleSchema,
    coverage: exports.CoverageSchema,
    created_at: zod_1.z.string().optional(),
    updated_at: zod_1.z.string().optional()
}).superRefine((data, ctx) => {
    const reqIds = new Set(data.role.requirements.map((r) => r.id));
    const questionIds = new Set(data.questions.map((q) => q.id));
    // Every question requirement_ids must reference an existing requirement
    data.questions.forEach((q, idx) => {
        q.requirement_ids.forEach((rid) => {
            if (!reqIds.has(rid)) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
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
                    code: zod_1.z.ZodIssueCode.custom,
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
                    code: zod_1.z.ZodIssueCode.custom,
                    message: `Schedule day ${day.day} references non-existent question_id '${qid}'`,
                    path: ["schedule", "days", idx, "question_ids"]
                });
            }
        });
    });
});
exports.BatchCaseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    jd: zod_1.z.string(),
    company_url: zod_1.z.string(),
    days: zod_1.z.number().int().positive()
});
exports.BatchInputSchema = zod_1.z.array(exports.BatchCaseSchema);
