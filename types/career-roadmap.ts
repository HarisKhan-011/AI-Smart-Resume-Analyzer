export const ROADMAP_STAGES = ["beginner", "intermediate", "advanced"] as const
export type RoadmapStageLevel = (typeof ROADMAP_STAGES)[number]

export const ROADMAP_PRIORITIES = ["high", "medium", "low"] as const
export type RoadmapPriority = (typeof ROADMAP_PRIORITIES)[number]

export type RoadmapStep = {
  skill: string
  topic: string
  priority: RoadmapPriority
  required: boolean
}

export type RoadmapStage = {
  level: RoadmapStageLevel
  title: string
  description: string
  steps: RoadmapStep[]
}

export type CareerRoadmapResult = {
  resume: {
    id: string
    fileName: string
    atsScore: number | null
    atsAnalysisStatus: string
  }
  target: {
    id: string
    title: string
    company: string
    location: string
    requiredSkills: string[]
    preferredSkills: string[]
  }
  coveragePercent: number
  matchScore: number | null
  currentSkills: string[]
  missingSkills: string[]
  preferredMissingSkills: string[]
  experience: string[]
  stages: RoadmapStage[]
  notes: string[]
}
