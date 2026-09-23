import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";
import { env } from "../config/env";
import { logger } from "./logger";

export class LLMError extends Error {
  code: string;
  constructor(message: string, code: string = "LLM_ERROR") {
    super(message);
    this.code = code;
  }
}

// Simple async queue for concurrency control
class ConcurrencyQueue {
  private activeCount = 0;
  private queue: (() => void)[] = [];

  constructor(private maxConcurrency: number = 2) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.maxConcurrency) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.activeCount++;
    try {
      return await fn();
    } finally {
      this.activeCount--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next) next();
      }
    }
  }
}

const llmQueue = new ConcurrencyQueue(2);

export interface LLMCallParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export async function callLLMJSON<T = any>(params: LLMCallParams): Promise<T> {
  return llmQueue.run(async () => {
    return executeLLMWithRetry<T>(params);
  });
}

async function executeLLMWithRetry<T>(params: LLMCallParams, attempt = 1): Promise<T> {
  const maxAttempts = 3;

  try {
    return await callGeminiJSON<T>(params);
  } catch (error: any) {
    const isRateLimit = error?.message?.includes("429") || error?.status === 429;
    logger.warn(`Gemini LLM call failed (attempt ${attempt}/${maxAttempts}): ${error.message}`);

    // If rate limited or failed twice, attempt Groq fallback if configured
    if (attempt >= 2 && env.GROQ_API_KEY) {
      logger.info("Attempting Groq LLM fallback...");
      try {
        return await callGroqJSON<T>(params);
      } catch (groqErr: any) {
        logger.error("Groq LLM fallback also failed:", groqErr.message);
      }
    }

    if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt) * 1000;
      logger.info(`Retrying LLM call in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return executeLLMWithRetry<T>(params, attempt + 1);
    }

    throw new LLMError(`LLM generation failed after ${maxAttempts} attempts: ${error.message}`);
  }
}

async function callGeminiJSON<T>(params: LLMCallParams): Promise<T> {
  if (!env.GEMINI_API_KEY) {
    throw new LLMError("GEMINI_API_KEY is missing", "NO_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: params.temperature ?? 0.2
    }
  });

  const fullPrompt = `${params.systemPrompt}\n\nUSER INPUT:\n${params.userPrompt}`;
  const result = await model.generateContent(fullPrompt);
  const responseText = result.response.text();

  return parseJSONResponse<T>(responseText);
}

async function callGroqJSON<T>(params: LLMCallParams): Promise<T> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: `${params.systemPrompt}\nIMPORTANT: Respond with valid JSON only.` },
        { role: "user", content: params.userPrompt }
      ],
      temperature: params.temperature ?? 0.2,
      response_format: { type: "json_object" }
    }),
    timeout: 10000
  } as any);

  if (!response.ok) {
    throw new Error(`Groq HTTP ${response.status}: ${await response.text()}`);
  }

  const data: any = await response.json();
  const text = data.choices[0]?.message?.content || "";
  return parseJSONResponse<T>(text);
}

function parseJSONResponse<T>(rawText: string): T {
  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (err: any) {
    throw new LLMError(`Invalid JSON returned by model: ${err.message}. Raw: ${cleaned.slice(0, 100)}...`, "INVALID_JSON");
  }
}
