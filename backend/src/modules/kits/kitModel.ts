import mongoose, { Schema, Document } from "mongoose";
import { Kit } from "@traq/shared";

export interface IKitDocument extends Document {
  userId: string;
  contentHash: string;
  status: "generating" | "ready" | "failed";
  stage?: string;
  kit: Kit | null;
  error: { code: string; message: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

const KitMongoSchema = new Schema<IKitDocument>(
  {
    userId: { type: String, required: true, index: true },
    contentHash: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["generating", "ready", "failed"],
      default: "generating"
    },
    stage: { type: String, default: "Initializing..." },
    kit: { type: Schema.Types.Mixed, default: null },
    error: { type: Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

export const KitModel = mongoose.model<IKitDocument>("Kit", KitMongoSchema);
