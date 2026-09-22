export type IndustryOutlook = "Growing" | "Stable"

export type IndustryDefinition = {
  id: string
  name: string
  summary: string
  outlook: IndustryOutlook
  outlookNote: string
  salaryRange: string
  hiringFocus: string
  roleHints: string[]
  typicalRoles: string[]
  inDemandSkills: string[]
  nextSkills: string[]
}

export type IndustrySkillStatus = {
  skill: string
  present: boolean
}

export type IndustryInsightsResult = {
  resumeId: string
  resumeFileName: string
  industryId: string
  industryName: string
  summary: string
  outlook: IndustryOutlook
  outlookNote: string
  salaryRange: string
  hiringFocus: string
  fitScore: number
  matchedCount: number
  inDemandCount: number
  typicalRoles: string[]
  skillCoverage: IndustrySkillStatus[]
  nextSkills: string[]
  alternatives: Array<{ id: string; name: string; fitScore: number }>
  disclaimer: string
}

export type IndustryInsightsSummary = {
  industryName: string
  fitScore: number
  outlook: IndustryOutlook
  matchedCount: number
  inDemandCount: number
}
