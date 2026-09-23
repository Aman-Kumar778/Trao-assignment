import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(`Error processing ${req.method} ${req.path}:`, err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected error occurred"
    }
  });
}
