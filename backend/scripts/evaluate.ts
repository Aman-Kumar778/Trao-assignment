import fs from "fs";
import path from "path";
import { runPipeline } from "../src/modules/kits/pipeline";
import { BatchInputSchema, BatchOutput, BatchKitResult } from "@traq/shared";
import { logger } from "../src/lib/logger";

async function runEvaluate() {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf("--input");
  const outputIdx = args.indexOf("--output");

  if (inputIdx === -1 || outputIdx === -1 || !args[inputIdx + 1] || !args[outputIdx + 1]) {
    console.error("Usage: npm run evaluate -- --input <cases.json> --output <kits.json>");
    process.exit(1);
  }

  let inputPath = path.resolve(args[inputIdx + 1]);
  let outputPath = path.resolve(args[outputIdx + 1]);

  if (!fs.existsSync(inputPath)) {
    const altInputPath = path.resolve(process.cwd(), "..", args[inputIdx + 1]);
    if (fs.existsSync(altInputPath)) {
      inputPath = altInputPath;
    }
  }

  if (args[outputIdx + 1].startsWith("backend/")) {
    outputPath = path.resolve(process.cwd(), "..", args[outputIdx + 1]);
  }

  logger.info(`Batch evaluation starting.`);
  logger.info(`Input path: ${inputPath}`);
  logger.info(`Output path: ${outputPath}`);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file does not exist: ${inputPath}`);
    process.exit(1);
  }

  const rawInput = fs.readFileSync(inputPath, "utf8");
  let cases: any[];
  try {
    cases = JSON.parse(rawInput);
  } catch (err: any) {
    console.error(`Invalid JSON in input file: ${err.message}`);
    process.exit(1);
  }

  const validation = BatchInputSchema.safeParse(cases);
  if (!validation.success) {
    console.error("Input cases failed validation:", validation.error.errors);
    process.exit(1);
  }

  const validCases = validation.data;
  logger.info(`Loaded ${validCases.length} test cases for evaluation.`);

  const results: BatchKitResult[] = [];

  for (let i = 0; i < validCases.length; i++) {
    const c = validCases[i];
    logger.info(`[${i + 1}/${validCases.length}] Processing case '${c.id}' (${c.company_url})...`);

    try {
      const kit = await runPipeline(c.jd, c.company_url, c.days, {
        onProgress: (stage) => logger.info(`Case ${c.id}: ${stage}`)
      });

      results.push({
        id: c.id,
        status: "ok",
        kit,
        error: null
      });
    } catch (err: any) {
      logger.error(`Case '${c.id}' failed:`, err);
      results.push({
        id: c.id,
        status: "failed",
        kit: null,
        error: {
          code: err.code || "PIPELINE_ERROR",
          message: err.message || "Failed to generate kit."
        }
      });
    }
  }

  const output: BatchOutput = {
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    kits: results
  };

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");
  logger.info(`Batch evaluation completed successfully. Output written to ${outputPath}`);
}

runEvaluate().catch((err) => {
  logger.error("Unhandled batch evaluation failure:", err);
  process.exit(1);
});
