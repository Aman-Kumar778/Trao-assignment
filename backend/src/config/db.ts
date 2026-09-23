import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../lib/logger";

export async function connectDB(): Promise<typeof mongoose | null> {
  if (!env.MONGODB_URI) {
    logger.warn("MONGODB_URI not defined, skipping MongoDB connection.");
    return null;
  }
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    return null;
  }
}
