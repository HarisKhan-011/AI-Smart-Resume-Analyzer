import type { ApplicationStatusCounts } from "@/services/applications/status"
import type { AtsBreakdown } from "@/types/resume"
import type { JobRecommendation } from "@/types/recommendation"

export type CareerMatchSummary = {
  jobId: string
  jobTitle: string | null
  company: string | null
  overallScore: number
  skillScore: number
  matchedSkills: string[]
  missingSkills: string[]
}

export type CareerIntelligenceSnapshot = {
  resumeCount: number
  primaryResume: {
    id: string
    fileName: string
    fileType: string
    skills: string[]
    analysisStatus: string
    atsScore: number | null
    atsBreakdown: AtsBreakdown | null
    atsIssues: string[]
    atsSuggestions: string[]
    atsAnalysisStatus: string
    createdAt: Date
  } | null
  recentResumes: Array<{
    id: string
    fileName: string
    fileType: string
    analysisStatus: string
    atsScore: number | null
    atsAnalysisStatus: string
    createdAt: Date
  }>
  atsScore: number | null
  jobMatchScore: number | null
  jobMatchLabel: string | null
  skillCoverage: number | null
  currentSkills: string[]
  missingSkills: string[]
  applicationCounts: ApplicationStatusCounts
  applicationTotal: number
  recommendedJobs: JobRecommendation[]
  persistedMatches: CareerMatchSummary[]
}
