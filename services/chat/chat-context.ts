import { isValidObjectId } from "mongoose"
import { dbConnect } from "@/lib/mongodb"
import { config } from "@/lib/config"
import { toStringId } from "@/lib/serialize"
import { Job } from "@/models/job"
import { getLearningSuggestions } from "@/lib/learning-suggestions"
import { listResumesByUser, getOwnedResume, type ResumeSummary } from "@/services/resume-service"
import { listMatchesByUser } from "@/services/match-service"
import { listOwnedApplicationsWithJobs } from "@/services/applications/application-service"
import { recommendJobsForUser, RecommendationError } from "@/services/recommendations/recommendation-service"
import type { CareerChatContext } from "@/types/chat"
import type { Resume } from "@/types/resume"

export class ChatError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 400, code = "CHAT_ERROR") {
    super(message)
    this.name = "ChatError"
    this.status = status
    this.code = code
  }
}

type JobLabel = {
  title: string
  company: string
}

type ChatContextDependencies = {
  listResumesByUser: typeof listResumesByUser
  getOwnedResume: typeof getOwnedResume
  listMatchesByUser: typeof listMatchesByUser
  listOwnedApplicationsWithJobs: typeof listOwnedApplicationsWithJobs
  recommendJobsForUser: typeof recommendJobsForUser
  loadJobLabels: (jobIds: string[]) => Promise<Map<string, JobLabel>>
}

const defaultDependencies: ChatContextDependencies = {
  listResumesByUser,
  getOwnedResume,
  listMatchesByUser,
  listOwnedApplicationsWithJobs,
  recommendJobsForUser,
  loadJobLabels,
}

function pickResume(resumes: ResumeSummary[]): ResumeSummary | null {
  return (
    resumes.find((resume) => resume.analysisStatus === "completed" && resume.skills.length > 0) ??
    resumes.find((resume) => resume.skills.length > 0) ??
    resumes[0] ??
    null
  )
}

function truncateExcerpt(text: string | undefined, maxChars: number): string | null {
  const normalized = text?.replace(/\s+/g, " ").trim() ?? ""
  if (!normalized) return null
  if (normalized.length <= maxChars) return normalized
  return `${normalized.slice(0, maxChars).trimEnd()}…`
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

function toResumeContext(resume: Resume): NonNullable<CareerChatContext["resume"]> {
  return {
    id: resume.id,
    fileName: resume.fileName,
    analysisStatus: resume.analysisStatus,
    skills: resume.skills ?? [],
    atsScore: resume.atsScore ?? null,
    atsBreakdown: resume.atsBreakdown ?? null,
    atsIssues: resume.atsIssues ?? [],
    atsSuggestions: resume.atsSuggestions ?? [],
    atsStrengths: resume.atsStrengths ?? [],
    atsAnalysisStatus: resume.atsAnalysisStatus ?? "pending",
    experience: (resume.experience ?? []).map((item) => ({
      position: item.position,
      company: item.company,
    })),
    education: (resume.education ?? []).map((item) => ({
      degree: item.degree,
      field: item.field,
      institution: item.institution,
    })),
    resumeExcerpt: truncateExcerpt(resume.extractedText, config.chat.resumeExcerptChars),
  }
}

export async function buildCareerChatContext(
  userId: string,
  profile: { name?: string | null; role?: string | null } = {},
  deps: ChatContextDependencies = defaultDependencies
): Promise<CareerChatContext> {
  const missingDataNotes: string[] = []

  const [resumes, matches, applications] = await Promise.all([
    deps.listResumesByUser(userId),
    deps.listMatchesByUser(userId),
    deps.listOwnedApplicationsWithJobs(userId),
  ])

  const selected = pickResume(resumes)
  let resume: CareerChatContext["resume"] = null
  if (!selected) {
    missingDataNotes.push("The user has not uploaded a resume.")
  } else {
    const owned = await deps.getOwnedResume(selected.id, userId)
    const resumeContext = owned
      ? toResumeContext(owned)
      : toResumeContext({ ...selected, extractedText: undefined } as Resume)
    resume = resumeContext
    if (!resumeContext.skills.length) {
      missingDataNotes.push("The selected resume has no extracted skills yet.")
    }
    if (resumeContext.atsAnalysisStatus !== "completed" || resumeContext.atsScore == null) {
      missingDataNotes.push("ATS analysis is not available for the selected resume.")
    }
    if (!resumeContext.resumeExcerpt) {
      missingDataNotes.push("No extracted resume text is available.")
    }
  }

  const topMatches = matches.slice(0, config.chat.matchLimit)
  const jobLabels = await deps.loadJobLabels(topMatches.map((match) => match.jobId))
  const jobMatches = topMatches.map((match) => {
    const job = jobLabels.get(match.jobId)
    return {
      jobTitle: job?.title ?? null,
      company: job?.company ?? null,
      overallScore: match.overallScore,
      skillScore: match.skillScore,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
    }
  })
  if (jobMatches.length === 0) {
    missingDataNotes.push("The user has no saved job match results.")
  }

  let recommendedJobs: CareerChatContext["recommendedJobs"] = []
  if (!selected) {
    missingDataNotes.push("No job recommendations are available yet.")
  } else {
    try {
      const ranked = await deps.recommendJobsForUser(userId, selected.id)
      recommendedJobs = ranked.recommendations.slice(0, config.chat.recommendationLimit).map((item) => ({
        title: item.job.title,
        company: item.job.company,
        location: item.job.location,
        overallScore: item.overallScore,
        matchedSkills: item.matchedSkills,
        missingSkills: item.missingSkills,
      }))
    } catch (error) {
      if (!(error instanceof RecommendationError)) {
        console.error("Career chat recommendations failed", {
          userId,
          error: error instanceof Error ? error.message : "unknown",
        })
      }
      missingDataNotes.push("Job recommendations could not be loaded from the user's current resume.")
    }
    if (
      recommendedJobs.length === 0 &&
      !missingDataNotes.includes("Job recommendations could not be loaded from the user's current resume.")
    ) {
      missingDataNotes.push("No job recommendations are available yet.")
    }
  }

  const missingSkills = [...new Set([
    ...jobMatches.flatMap((match) => match.missingSkills),
    ...recommendedJobs.flatMap((item) => item.missingSkills),
  ])].slice(0, 12)

  if (missingSkills.length === 0) {
    missingDataNotes.push("No skill-gap data is available from matches or recommendations.")
  }

  const applicationContext = applications.slice(0, 12).map((item) => ({
    status: item.status,
    jobTitle: item.job?.title ?? null,
    company: item.job?.company ?? null,
    matchScore: item.matchScore,
    notes: item.notes?.trim() ? item.notes.trim().slice(0, 280) : "",
  }))
  if (applicationContext.length === 0) {
    missingDataNotes.push("The user has no tracked job applications.")
  }

  return {
    missingDataNotes: [...new Set(missingDataNotes)],
    user: {
      name: profile.name?.trim() || null,
      role: profile.role?.trim() || "candidate",
    },
    resume,
    jobMatches,
    skillGaps: {
      missingSkills,
      learningSuggestions: getLearningSuggestions(missingSkills).slice(0, 8),
    },
    applications: applicationContext,
    recommendedJobs,
  }
}

export function formatCareerChatContext(context: CareerChatContext): string {
  return JSON.stringify(context)
}
