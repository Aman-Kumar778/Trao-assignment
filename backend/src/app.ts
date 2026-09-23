import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";

import { authRouter } from "./modules/auth/authRoutes";
import { kitRouter } from "./modules/kits/kitRoutes";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.FRONTEND_URL === "*" || origin === env.FRONTEND_URL || env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/kits", kitRouter);

// Health Check route
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "traq-backend", timestamp: new Date().toISOString() });
});

// Global error handler
app.use(errorHandler);
