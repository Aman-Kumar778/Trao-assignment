import {
  Kit,
  KitSource,
  CompanyBrief,
  RoleInfo,
  Question,
  Flashcard,
  Schedule,
  Coverage,
  KitSchema
} from "@traq/shared";

export function assembleKit(
  source: KitSource,
  companyBrief: CompanyBrief,
  role: RoleInfo,
  questions: Question[],
  flashcards: Flashcard[],
  schedule: Schedule,
  coverage: Coverage
): Kit {
  return {
    source,
    company_brief: companyBrief,
    role,
    questions,
    flashcards,
    schedule,
    coverage
  };
}

export function validateKit(kit: Kit): { valid: boolean; errors?: string[] } {
  const result = KitSchema.safeParse(kit);
  if (!result.success) {
    const formattedErrors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    return { valid: false, errors: formattedErrors };
  }
  return { valid: true };
}
