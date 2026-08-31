import { Schema, model, models, type Document, type Model, type Types } from "mongoose"

export interface MatchDocument extends Document {
  userId: Types.ObjectId
  resumeId: Types.ObjectId
  jobId: Types.ObjectId
  overallScore: number
  skillScore: number
  experienceScore: number
  matchedSkills: string[]
  missingSkills: string[]
  createdAt: Date
}

const scoreField = {
  type: Number,
  required: true,
  min: 0,
  max: 100,
  default: 0,
}

const MatchSchema = new Schema<MatchDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    overallScore: scoreField,
    skillScore: scoreField,
    experienceScore: scoreField,
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

MatchSchema.index({ userId: 1, jobId: 1 }, { unique: true })
MatchSchema.index({ resumeId: 1, jobId: 1 })
MatchSchema.index({ overallScore: -1 })

export const Match: Model<MatchDocument> =
  (models.Match as Model<MatchDocument> | undefined) ??
  model<MatchDocument>("Match", MatchSchema)
