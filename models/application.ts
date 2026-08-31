import { Schema, model, models, type Document, type Model, type Types } from "mongoose"
import type { ApplicationStatus } from "@/types/application"

export interface ApplicationDocument extends Document {
  userId: Types.ObjectId
  jobId: Types.ObjectId
  status: ApplicationStatus
  appliedAt?: Date | null
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const ApplicationSchema = new Schema<ApplicationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    status: {
      type: String,
      enum: ["saved", "applied", "interview", "rejected", "offered"],
      default: "saved",
      required: true,
    },
    appliedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

ApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true })
ApplicationSchema.index({ status: 1 })
ApplicationSchema.index({ appliedAt: -1 })

export const Application: Model<ApplicationDocument> =
  (models.Application as Model<ApplicationDocument> | undefined) ??
  model<ApplicationDocument>("Application", ApplicationSchema)
