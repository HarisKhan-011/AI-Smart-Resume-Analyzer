import { isValidObjectId } from "mongoose"
import { calculateMatch, type CalculatedMatch } from "@/services/matching/match-service"
import { combineSkillAndSemanticScores } from "@/services/matching/score"
import { calculateSemanticScore } from "@/services/ai/semantic-matching"
import { getOwnedResume } from "@/services/resume-service"
import { getAccessibleJob } from "@/services/job-service"
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
  semanticAvailable: boolean
  resume: Pick<ResumeSummary, "id" | "fileName" | "analysisStatus">
  job: Pick<Job, "id" | "title" | "company" | "location" | "requiredSkills" | "preferredSkills">
}

type RunMatchDependencies = {
  getOwnedResume: typeof getOwnedResume
  getOwnedJob: typeof getAccessibleJob
  calculateMatch: typeof calculateMatch
  calculateSemanticScore: typeof calculateSemanticScore
  saveMatch: typeof upsertMatch
}

const defaultDependencies: RunMatchDependencies = {
  getOwnedResume,
  getOwnedJob: getAccessibleJob,
  calculateMatch,
  calculateSemanticScore,
  saveMatch: upsertMatch,
}

export async function matchOwnedResumeToJob(
  userId: string,
  resumeId: string,
  jobId: string,
  deps: Partial<RunMatchDependencies> = {}
): Promise<MatchRunResult> {
  const resolved: RunMatchDependencies = { ...defaultDependencies, ...deps }

  if (!isValidObjectId(resumeId) || !isValidObjectId(jobId)) {
    throw new MatchingError("A valid resume and job are required.", 400, "INVALID_IDS")
  }

  const resume = await resolved.getOwnedResume(resumeId, userId)
  if (!resume) {
    throw new MatchingError("Resume not found.", 404, "RESUME_NOT_FOUND")
  }

  const job = await resolved.getOwnedJob(jobId, userId)
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

  const comparison = resolved.calculateMatch({
    resumeSkills: resume.skills,
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
  })

  const semantic = await resolved.calculateSemanticScore(
    resume.extractedText ?? "",
    [job.title, job.company, job.description].filter(Boolean).join("\n")
  ).catch(() => ({ semanticScore: 0, available: false }))

  const combined = combineSkillAndSemanticScores(
    comparison.skillScore,
    semantic.semanticScore,
    semantic.available
  )

  const scored: CalculatedMatch = {
    ...comparison,
    skillScore: combined.skillScore,
    semanticScore: combined.semanticScore,
    overallScore: combined.overallScore,
  }

  const payload: CreateMatchInput = {
    userId,
    resumeId: resume.id,
    jobId: job.id,
    overallScore: scored.overallScore,
    skillScore: scored.skillScore,
    semanticScore: scored.semanticScore,
    experienceScore: scored.experienceScore,
    matchedSkills: scored.matchedSkills,
    missingSkills: scored.missingSkills,
  }

  const match = await resolved.saveMatch(payload)

  return {
    match,
    comparison: scored,
    semanticAvailable: semantic.available,
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
