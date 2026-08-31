import { Schema, model, models, type Document, type Model } from "mongoose"
import type { SkillCategory } from "@/types/skill"

export interface SkillDocument extends Document {
  name: string
  category: SkillCategory
  aliases: string[]
  createdAt: Date
  updatedAt: Date
}

const SkillSchema = new Schema<SkillDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["programming", "frameworks", "databases", "cloud", "tools", "soft_skills"],
      required: true,
    },
    aliases: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

SkillSchema.index({ name: 1 }, { unique: true })
SkillSchema.index({ category: 1 })
SkillSchema.index({ aliases: 1 })

export const Skill: Model<SkillDocument> =
  (models.Skill as Model<SkillDocument> | undefined) ??
  model<SkillDocument>("Skill", SkillSchema)
