export type SkillComparison = {
  matchedSkills: string[]
  missingSkills: string[]
  preferredMatchedSkills: string[]
  preferredMissingSkills: string[]
}

export type MatchScoreBreakdown = {
  overallScore: number
  skillScore: number
  experienceScore: number
  educationScore: number
}

export type CalculatedMatch = SkillComparison & MatchScoreBreakdown
