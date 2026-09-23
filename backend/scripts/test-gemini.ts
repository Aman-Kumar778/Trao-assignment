import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function test() {
  const models = ["gemini-2.5-flash"];
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("Respond in JSON only: {\"status\": \"ok\", \"message\": \"working\"}");
      console.log(`✅ SUCCESS with model '${m}': ${res.response.text()}`);
      return m;
    } catch (e: any) {
      console.log(`❌ FAILED with model '${m}': ${e.message}`);
    }
  }
}

test();
