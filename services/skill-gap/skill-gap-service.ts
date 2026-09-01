import { calculateMatch, type CalculatedMatch } from "@/services/matching/match-service"
import { getLearningSuggestion } from "@/lib/learning-suggestions"
import { isValidObjectId } from "mongoose"
import { getOwnedResume } from "@/services/resume-service"
import { getAccessibleJob } from "@/services/job-service"
import { upsertMatch } from "@/services/match-service"
import { MatchingError } from "@/services/matching/run-match"
import type { Match } from "@/types/matching"
import type { Job } from "@/types/job"
import type { ResumeSummary } from "@/services/resume-service"

export type LearningRecommendation = {
  skill: string
  suggestion: string
  required: boolean
}

export type SkillGapResult = {
  coveragePercent: number
  matchedSkills: string[]
  missingSkills: string[]
  preferredMatchedSkills: string[]
  preferredMissingSkills: string[]
  recommendations: LearningRecommendation[]
}

export type OwnedSkillGapResult = SkillGapResult & {
  match: Match
  resume: Pick<ResumeSummary, "id" | "fileName" | "analysisStatus">
  job: Pick<Job, "id" | "title" | "company" | "location" | "requiredSkills" | "preferredSkills">
}

type SkillGapDependencies = {
  getOwnedResume: typeof getOwnedResume
  getOwnedJob: typeof getAccessibleJob
  saveMatch: typeof upsertMatch
  calculateMatch: typeof calculateMatch
}

const defaultDependencies: SkillGapDependencies = {
  getOwnedResume,
  getOwnedJob: getAccessibleJob,
  saveMatch: upsertMatch,
  calculateMatch,
}

export function buildLearningRecommendations(
  missingSkills: string[],
  preferredMissingSkills: string[] = []
): LearningRecommendation[] {
  return [
    ...missingSkills.map((skill) => ({
      skill,
      suggestion: getLearningSuggestion(skill),
      required: true,
    })),
    ...preferredMissingSkills.map((skill) => ({
      skill,
      suggestion: getLearningSuggestion(skill),
      required: false,
    })),
  ]
}

function toSkillGapResult(comparison: CalculatedMatch): SkillGapResult {
  return {
    coveragePercent: comparison.skillScore,
    matchedSkills: comparison.matchedSkills,
    missingSkills: comparison.missingSkills,
    preferredMatchedSkills: comparison.preferredMatchedSkills,
    preferredMissingSkills: comparison.preferredMissingSkills,
    recommendations: buildLearningRecommendations(
      comparison.missingSkills,
      comparison.preferredMissingSkills
    ),
  }
}

export function calculateSkillGap(input: {
  resumeSkills: string[]
  requiredSkills: string[]
  preferredSkills?: string[]
}): SkillGapResult {
  return toSkillGapResult(
    calculateMatch({
      resumeSkills: input.resumeSkills,
      requiredSkills: input.requiredSkills,
      preferredSkills: input.preferredSkills ?? [],
    })
  )
}

export async function analyzeOwnedSkillGap(
  userId: string,
  resumeId: string,
  jobId: string,
  deps: SkillGapDependencies = defaultDependencies
): Promise<OwnedSkillGapResult> {
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
      "This job has no required skills to compare. Analyze the job first.",
      400,
      "JOB_NOT_ANALYZED"
    )
  }

  const comparison = deps.calculateMatch({
    resumeSkills: resume.skills,
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
  })
  const gap = toSkillGapResult(comparison)

  const match = await deps.saveMatch({
    userId,
    resumeId: resume.id,
    jobId: job.id,
    overallScore: comparison.overallScore,
    skillScore: comparison.skillScore,
    semanticScore: comparison.semanticScore,
    experienceScore: comparison.experienceScore,
    matchedSkills: comparison.matchedSkills,
    missingSkills: comparison.missingSkills,
  })

  return {
    ...gap,
    match,
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
