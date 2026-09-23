import { Response } from "express";
import crypto from "crypto";
import { AuthenticatedRequest } from "../auth/authMiddleware";
import { KitModel } from "./kitModel";
import { runPipeline } from "./pipeline";
import { generateCompanyBrief, generateQuestionsForCategory } from "../generation";
import { checkCoverage } from "../coverage";
import { buildSchedule } from "../scheduling";
import { validateKit } from "./kitAssembler";

function computeHash(jd: string, url: string): string {
  return crypto.createHash("md5").update(`${jd.trim()}:${url.trim()}`).digest("hex");
}

export async function createKit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { jd, company_url, days } = req.body;

    if (!jd || typeof jd !== "string" || !jd.trim()) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Job description is required." } });
    }

    const daysAvailable = Math.max(1, parseInt(days, 10) || 5);
    const companyUrl = (company_url || "").trim();
    const contentHash = computeHash(jd, companyUrl);

    // Idempotency check: if user already generated a ready kit with identical JD + URL, return it
    const existing = await KitModel.findOne({ userId, contentHash, status: "ready" });
    if (existing && existing.kit) {
      return res.status(200).json({ kitId: existing._id, status: "ready", kit: existing.kit });
    }

    // Create new generating record
    const kitDoc = await KitModel.create({
      userId,
      contentHash,
      status: "generating",
      stage: "Initializing generation pipeline...",
      kit: null,
      error: null
    });

    // Run pipeline asynchronously
    runPipeline(jd, companyUrl, daysAvailable, {
      onProgress: (stage) => {
        KitModel.findByIdAndUpdate(kitDoc._id, { stage }).catch(() => {});
      }
    })
      .then((generatedKit) => {
        KitModel.findByIdAndUpdate(kitDoc._id, {
          status: "ready",
          stage: "Complete",
          kit: generatedKit
        }).catch(() => {});
      })
      .catch((err) => {
        KitModel.findByIdAndUpdate(kitDoc._id, {
          status: "failed",
          stage: "Failed",
          error: {
            code: "PIPELINE_ERROR",
            message: err.message || "Pipeline execution failed."
          }
        }).catch(() => {});
      });

    return res.status(202).json({
      kitId: kitDoc._id,
      status: "generating",
      stage: kitDoc.stage
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: error.message } });
  }
}

export async function getKits(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const kits = await KitModel.find({ userId }).sort({ createdAt: -1 });
    return res.json({ kits });
  } catch (error: any) {
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: error.message } });
  }
}

export async function getKitById(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const kitDoc = await KitModel.findOne({ _id: id, userId });
    if (!kitDoc) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Kit not found or access denied." } });
    }

    return res.json({
      id: kitDoc._id,
      status: kitDoc.status,
      stage: kitDoc.stage,
      kit: kitDoc.kit,
      error: kitDoc.error,
      created_at: kitDoc.createdAt
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: error.message } });
  }
}

export async function patchKit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const updatedKitData = req.body;

    const kitDoc = await KitModel.findOne({ _id: id, userId });
    if (!kitDoc || !kitDoc.kit) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Kit not found or not ready." } });
    }

    // Validate updated kit schema
    const validation = validateKit(updatedKitData);
    if (!validation.valid) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid kit structure", details: validation.errors } });
    }

    kitDoc.kit = updatedKitData;
    await kitDoc.save();

    return res.json({ status: "updated", kit: kitDoc.kit });
  } catch (error: any) {
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: error.message } });
  }
}

export async function regenerateSection(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { section } = req.body;

    const kitDoc = await KitModel.findOne({ _id: id, userId });
    if (!kitDoc || !kitDoc.kit) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Kit not found or not ready." } });
    }

    const currentKit = kitDoc.kit;
    let preservedCount = 0;
    let newCount = 0;

    if (section === "brief") {
      const newBrief = await generateCompanyBrief([], currentKit.source.role);
      // If user edited brief, keep user edited
      if (currentKit.company_brief._meta?.origin === "user_edited") {
        preservedCount = 1;
      } else {
        currentKit.company_brief = newBrief;
        newCount = 1;
      }
    } else if (["technical", "behavioural", "system-design", "company-fit"].includes(section)) {
      const newQuestions = await generateQuestionsForCategory(currentKit.role.requirements, section);

      // NON-DESTRUCTIVE MERGE ALGORITHM:
      // Keep any question in this section with origin === 'user_edited' or 'user_added'
      const existingInTargetCat = currentKit.questions.filter((q) => q.category === section);
      const pinnedQuestions = existingInTargetCat.filter(
        (q) => q._meta?.origin === "user_edited" || q._meta?.origin === "user_added"
      );
      preservedCount = pinnedQuestions.length;

      const otherCatQuestions = currentKit.questions.filter((q) => q.category !== section);

      // Merge pinned questions + newly generated questions
      currentKit.questions = [...otherCatQuestions, ...pinnedQuestions, ...newQuestions];
      newCount = newQuestions.length;

      // Recalculate coverage check
      currentKit.coverage.uncovered_requirement_ids = checkCoverage(
        currentKit.role.requirements,
        currentKit.questions
      );

      // Recalculate schedule
      currentKit.schedule = buildSchedule(
        currentKit.role.requirements,
        currentKit.questions,
        currentKit.schedule.days_available
      );
    } else if (section === "schedule") {
      currentKit.schedule = buildSchedule(
        currentKit.role.requirements,
        currentKit.questions,
        currentKit.schedule.days_available
      );
      newCount = 1;
    } else {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: `Invalid section target '${section}'.` } });
    }

    kitDoc.markModified("kit");
    await kitDoc.save();

    return res.json({
      status: "regenerated",
      summary: `${newCount} items regenerated, ${preservedCount} user-edited items preserved.`,
      kit: currentKit
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: error.message } });
  }
}

export async function deleteKit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await KitModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Kit not found or access denied." } });
    }

    return res.json({ status: "deleted" });
  } catch (error: any) {
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: error.message } });
  }
}
