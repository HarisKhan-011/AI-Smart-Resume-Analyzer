import { isValidObjectId } from "mongoose"
import { calculateMatch, type CalculatedMatch } from "@/services/matching/match-service"
import { getOwnedResume } from "@/services/resume-service"
import { getOwnedJob } from "@/services/job-service"
import { upsertMatch, type CreateMatchInput } from "@/services/match-service"
import type { Job } from "@/types/job"
import type { Match } from "@/types/matching"
import type { ResumeSummary } from "@/services/resume-service"

export class MatchingError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 400, code = "MATCHING_ERROR") {
    super(message)
    this.name = "MatchingError"
    this.status = status
    this.code = code
  }
}

export type MatchRunResult = {
  match: Match
  comparison: CalculatedMatch
  resume: Pick<ResumeSummary, "id" | "fileName" | "analysisStatus">
  job: Pick<Job, "id" | "title" | "company" | "location" | "requiredSkills" | "preferredSkills">
}

type RunMatchDependencies = {
  getOwnedResume: typeof getOwnedResume
  getOwnedJob: typeof getOwnedJob
  calculateMatch: typeof calculateMatch
  saveMatch: typeof upsertMatch
}

const defaultDependencies: RunMatchDependencies = {
  getOwnedResume,
  getOwnedJob,
  calculateMatch,
  saveMatch: upsertMatch,
}

export async function matchOwnedResumeToJob(
  userId: string,
  resumeId: string,
  jobId: string,
  deps: RunMatchDependencies = defaultDependencies
): Promise<MatchRunResult> {
  if (!isValidObjectId(resumeId) || !isValidObjectId(jobId)) {
    throw new MatchingError("A valid resume and job are required.", 400, "INVALID_IDS")
  }

  const resume = await deps.getOwnedResume(resumeId, userId)
  if (!resume) {
    throw new MatchingError("Resume not found.", 404, "RESUME_NOT_FOUND")
  }

  const job = await deps.getOwnedJob(jobId, userId)
  if (!job) {
    throw new MatchingError("Job not found.", 404, "JOB_NOT_FOUND")
  }

  if (!resume.skills.length) {
    throw new MatchingError(
      "This resume has no extracted skills. Analyze the resume first.",
      400,
      "RESUME_NOT_ANALYZED"
    )
  }

  if (!job.requiredSkills.length) {
    throw new MatchingError(
      "This job has no required skills to match against. Analyze the job first.",
      400,
      "JOB_NOT_ANALYZED"
    )
  }

  const comparison = deps.calculateMatch({
    resumeSkills: resume.skills,
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
  })

  const payload: CreateMatchInput = {
    userId,
    resumeId: resume.id,
    jobId: job.id,
    overallScore: comparison.overallScore,
    skillScore: comparison.skillScore,
    experienceScore: comparison.experienceScore,
    matchedSkills: comparison.matchedSkills,
    missingSkills: comparison.missingSkills,
  }

  const match = await deps.saveMatch(payload)

  return {
    match,
    comparison,
    resume: {
      id: resume.id,
      fileName: resume.fileName,
      analysisStatus: resume.analysisStatus,
    },
    job: {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
    },
  }
}
