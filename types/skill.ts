import type { SKILL_CATEGORIES } from "@/lib/constants"

export type SkillCategory = (typeof SKILL_CATEGORIES)[keyof typeof SKILL_CATEGORIES]

export interface Skill {
  id: string
  name: string
  category: SkillCategory
  aliases: string[]
  createdAt: Date
  updatedAt: Date
}
