export interface SkillGap {
  skill: string
  required: boolean
  proficiency?: "beginner" | "intermediate" | "advanced"
}

export interface Match {
  id: string
  userId: string
  resumeId: string
  jobId: string
  overallScore: number
  skillScore: number
  experienceScore: number
  matchedSkills: string[]
  missingSkills: string[]
  createdAt: Date
}

/** @deprecated Use Match. Kept for UI compatibility until the matching phase. */
export interface MatchResult {
  resumeId: string
  jobId: string
  score: number
  matchedSkills: string[]
  missingSkills: string[]
  skillGapAnalysis: SkillGap[]
  createdAt: Date
}
