import { Router } from "express";
import { register, login, logout, me } from "./authController";
import { requireAuth } from "./authMiddleware";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
