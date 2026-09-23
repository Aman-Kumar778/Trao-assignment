import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config(); // fallback to root .env if present

export const env = {
  PORT: process.env.PORT || "5000",
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/traq_interview_prep",
  JWT_SECRET: process.env.JWT_SECRET || "development_jwt_secret_key_12345",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  TAVILY_API_KEY: process.env.TAVILY_API_KEY || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000"
};
