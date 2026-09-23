import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "./userModel";
import { env } from "../../config/env";
import { AuthenticatedRequest } from "./authMiddleware";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Email and password are required." } });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Password must be at least 6 characters long." } });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: { code: "USER_EXISTS", message: "An account with this email already exists." } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash
    });

    const token = jwt.sign({ id: user._id.toString(), email: user.email }, env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, COOKIE_OPTIONS);

    return res.status(201).json({
      user: {
        id: user._id.toString(),
        email: user.email
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: error.message || "Failed to register user." } });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Email and password are required." } });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } });
    }

    const token = jwt.sign({ id: user._id.toString(), email: user.email }, env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, COOKIE_OPTIONS);

    return res.json({
      user: {
        id: user._id.toString(),
        email: user.email
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: error.message || "Failed to log in." } });
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("token", COOKIE_OPTIONS);
  return res.json({ status: "logged_out" });
}

export async function me(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
  }
  return res.json({ user: req.user });
}
