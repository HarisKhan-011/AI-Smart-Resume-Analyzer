import type { EmploymentType, JobSource } from "@/types/job"

export type JobRecommendation = {
  jobId: string
  resumeId: string
  overallScore: number
  skillScore: number
  preferredScore: number
  experienceScore: number
  relevanceScore: number
  matchedSkills: string[]
  missingSkills: string[]
  preferredMatchedSkills: string[]
  job: {
    id: string
    title: string
    company: string
    location: string
    employmentType: EmploymentType
    source: JobSource
    sourceUrl?: string | null
  }
}
