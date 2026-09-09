import { isValidObjectId } from "mongoose"
import { dbConnect } from "@/lib/mongodb"
import { toStringId } from "@/lib/serialize"
import { Job } from "@/models/job"
import { listResumesByUser, type ResumeSummary } from "@/services/resume-service"
import { listMatchesByUser } from "@/services/match-service"
import { countOwnedApplicationsByStatus } from "@/services/applications/application-service"
import {
  APPLICATION_STATUS_ORDER,
  emptyApplicationCounts,
} from "@/services/applications/status"
import {
  recommendJobsForUser,
  RecommendationError,
} from "@/services/recommendations/recommendation-service"
import type { CareerIntelligenceSnapshot, CareerMatchSummary } from "@/types/career-intelligence"

type JobLabel = {
  title: string
  company: string
}

type CareerIntelligenceDependencies = {
  listResumesByUser: typeof listResumesByUser
  listMatchesByUser: typeof listMatchesByUser
  countOwnedApplicationsByStatus: typeof countOwnedApplicationsByStatus
  recommendJobsForUser: typeof recommendJobsForUser
  loadJobLabels: (jobIds: string[]) => Promise<Map<string, JobLabel>>
}

const defaultDependencies: CareerIntelligenceDependencies = {
  listResumesByUser,
  listMatchesByUser,
  countOwnedApplicationsByStatus,
  recommendJobsForUser,
  loadJobLabels,
}

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }
  return result
}

export function pickPrimaryResume(resumes: ResumeSummary[]): ResumeSummary | null {
  return (
    resumes.find((resume) => resume.analysisStatus === "completed" && resume.skills.length > 0) ??
    resumes.find((resume) => resume.skills.length > 0) ??
    resumes[0] ??
    null
  )
}

async function loadJobLabels(jobIds: string[]): Promise<Map<string, JobLabel>> {
  const uniqueIds = [...new Set(jobIds.filter((id) => isValidObjectId(id)))]
  if (uniqueIds.length === 0) return new Map()

  await dbConnect()
  const jobs = await Job.find({ _id: { $in: uniqueIds } }).select("title company")
  return new Map(
    jobs.map((job) => [
      toStringId(job._id),
      { title: job.title, company: job.company },
    ])
  )
}

export async function loadCareerIntelligence(
  userId: string,
  deps: CareerIntelligenceDependencies = defaultDependencies
): Promise<CareerIntelligenceSnapshot> {
  const [resumes, matches, applicationCounts] = await Promise.all([
    deps.listResumesByUser(userId),
    deps.listMatchesByUser(userId),
    deps.countOwnedApplicationsByStatus(userId).catch(() => emptyApplicationCounts()),
  ])

  const primary = pickPrimaryResume(resumes)
  let recommendedJobs: CareerIntelligenceSnapshot["recommendedJobs"] = []
  if (primary?.skills.length) {
    try {
      const ranked = await deps.recommendJobsForUser(userId, primary.id)
      recommendedJobs = ranked.recommendations
    } catch (error) {
      if (!(error instanceof RecommendationError)) {
        console.error("Dashboard recommendations failed", {
          userId,
          error: error instanceof Error ? error.message : "unknown",
        })
      }
      recommendedJobs = []
    }
  }

  const topMatches = matches.slice(0, 8)
  const jobLabels = await deps.loadJobLabels(topMatches.map((match) => match.jobId))
  const persistedMatches: CareerMatchSummary[] = topMatches.map((match) => {
    const job = jobLabels.get(match.jobId)
    return {
      jobId: match.jobId,
      jobTitle: job?.title ?? null,
      company: job?.company ?? null,
      overallScore: match.overallScore,
      skillScore: match.skillScore,
      matchedSkills: match.matchedSkills ?? [],
      missingSkills: match.missingSkills ?? [],
    }
  })

  const bestMatch = persistedMatches[0]
  const bestRecommendation = recommendedJobs[0]
  const atsReady =
    primary?.atsAnalysisStatus === "completed" && typeof primary.atsScore === "number"

  const applicationTotal = APPLICATION_STATUS_ORDER.reduce(
    (sum, status) => sum + applicationCounts[status],
    0
  )

  return {
    resumeCount: resumes.length,
    primaryResume: primary
      ? {
          id: primary.id,
          fileName: primary.fileName,
          fileType: primary.fileType,
          skills: primary.skills ?? [],
          analysisStatus: primary.analysisStatus,
          atsScore: primary.atsScore ?? null,
          atsBreakdown: primary.atsBreakdown ?? null,
          atsIssues: primary.atsIssues ?? [],
          atsSuggestions: primary.atsSuggestions ?? [],
          atsAnalysisStatus: primary.atsAnalysisStatus ?? "pending",
          createdAt: primary.createdAt,
        }
      : null,
    recentResumes: resumes.slice(0, 5).map((resume) => ({
      id: resume.id,
      fileName: resume.fileName,
      fileType: resume.fileType,
      analysisStatus: resume.analysisStatus,
      atsScore: resume.atsScore ?? null,
      atsAnalysisStatus: resume.atsAnalysisStatus ?? "pending",
      createdAt: resume.createdAt,
    })),
    atsScore: atsReady && primary ? (primary.atsScore ?? null) : null,
    jobMatchScore: bestMatch?.overallScore ?? bestRecommendation?.overallScore ?? null,
    jobMatchLabel:
      bestMatch?.jobTitle ??
      (bestRecommendation ? `${bestRecommendation.job.title} at ${bestRecommendation.job.company}` : null),
    skillCoverage: bestMatch?.skillScore ?? bestRecommendation?.skillScore ?? null,
    currentSkills: unique(primary?.skills ?? []).slice(0, 16),
    missingSkills: unique([
      ...persistedMatches.flatMap((match) => match.missingSkills),
      ...recommendedJobs.flatMap((item) => item.missingSkills),
    ]).slice(0, 16),
    applicationCounts,
    applicationTotal,
    recommendedJobs,
    persistedMatches,
  }
}
