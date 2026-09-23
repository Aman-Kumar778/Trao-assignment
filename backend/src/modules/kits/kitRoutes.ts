import { Router } from "express";
import { requireAuth } from "../auth/authMiddleware";
import {
  createKit,
  getKits,
  getKitById,
  patchKit,
  regenerateSection,
  deleteKit
} from "./kitController";

export const kitRouter = Router();

kitRouter.use(requireAuth);

kitRouter.post("/", createKit);
kitRouter.get("/", getKits);
kitRouter.get("/:id", getKitById);
kitRouter.patch("/:id", patchKit);
kitRouter.post("/:id/regenerate", regenerateSection);
kitRouter.delete("/:id", deleteKit);
