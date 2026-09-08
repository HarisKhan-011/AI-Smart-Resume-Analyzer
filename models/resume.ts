import { Schema, model, models, type Document, type Model, type Types } from "mongoose"
import type {
  AnalysisStatus,
  AtsAnalysisStatus,
  AtsBreakdown,
  Education,
  ExtractedSkill,
  WorkExperience,
} from "@/types/resume"

const WorkExperienceSchema = new Schema<WorkExperience>(
  {
    company: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    startDate: { type: String, required: true, trim: true },
    endDate: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false }
)

const EducationSchema = new Schema<Education>(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    field: { type: String, required: true, trim: true },
    graduationYear: { type: String, required: true, trim: true },
  },
  { _id: false }
)

const ExtractedSkillSchema = new Schema<ExtractedSkill>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
)

const AtsBreakdownSchema = new Schema<AtsBreakdown>(
  {
    contact: { type: Number, min: 0, max: 100, default: 0 },
    sections: { type: Number, min: 0, max: 100, default: 0 },
    keywords: { type: Number, min: 0, max: 100, default: 0 },
    readability: { type: Number, min: 0, max: 100, default: 0 },
    experience: { type: Number, min: 0, max: 100, default: 0 },
    completeness: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
)

export interface ResumeDocument extends Document {
  userId: Types.ObjectId
  fileName: string
  fileUrl: string
  fileType: string
  extractedText?: string
  skills: string[]
  extractedSkills: ExtractedSkill[]
  experience: WorkExperience[]
  education: Education[]
  analysisStatus: AnalysisStatus
  atsScore?: number | null
  atsBreakdown?: AtsBreakdown | null
  atsIssues: string[]
  atsSuggestions: string[]
  atsStrengths: string[]
  atsAnalysisStatus: AtsAnalysisStatus
  createdAt: Date
  updatedAt: Date
}

const ResumeSchema = new Schema<ResumeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      required: true,
      trim: true,
    },
    extractedText: {
      type: String,
      default: "",
      select: false,
    },
    skills: {
      type: [String],
      default: [],
    },
    extractedSkills: {
      type: [ExtractedSkillSchema],
      default: [],
    },
    experience: {
      type: [WorkExperienceSchema],
      default: [],
    },
    education: {
      type: [EducationSchema],
      default: [],
    },
    analysisStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      required: true,
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    atsBreakdown: {
      type: AtsBreakdownSchema,
      default: null,
    },
    atsIssues: {
      type: [String],
      default: [],
    },
    atsSuggestions: {
      type: [String],
      default: [],
    },
    atsStrengths: {
      type: [String],
      default: [],
    },
    atsAnalysisStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

ResumeSchema.index({ userId: 1, createdAt: -1 })
ResumeSchema.index({ analysisStatus: 1 })

export const Resume: Model<ResumeDocument> =
  (models.Resume as Model<ResumeDocument> | undefined) ??
  model<ResumeDocument>("Resume", ResumeSchema)
