import { Schema, model, models, type Document, type Model, type Types } from "mongoose"
import type { EmploymentType, JobSource } from "@/types/job"

export interface JobDocument extends Document {
  title: string
  company: string
  location: string
  description: string
  requiredSkills: string[]
  preferredSkills: string[]
  employmentType: EmploymentType
  source: JobSource
  sourceUrl?: string | null
  postedDate: Date
  createdBy?: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const JobSchema = new Schema<JobDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    preferredSkills: {
      type: [String],
      default: [],
    },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "freelance", "temporary"],
      default: "full-time",
      required: true,
    },
    source: {
      type: String,
      enum: ["manual", "api", "scrape"],
      default: "manual",
      required: true,
    },
    sourceUrl: {
      type: String,
      default: null,
      trim: true,
    },
    postedDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

JobSchema.index({ title: 1, company: 1 })
JobSchema.index({ source: 1, sourceUrl: 1 })
JobSchema.index(
  { sourceUrl: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceUrl: { $type: "string" } },
  }
)
JobSchema.index({ postedDate: -1 })
JobSchema.index({ requiredSkills: 1 })
JobSchema.index({ createdBy: 1 })

export const Job: Model<JobDocument> =
  (models.Job as Model<JobDocument> | undefined) ??
  model<JobDocument>("Job", JobSchema)
