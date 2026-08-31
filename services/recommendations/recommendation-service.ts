import { isValidObjectId } from "mongoose"
import { config } from "@/lib/config"
import { calculateMatch } from "@/services/matching/match-service"
import { compareSkills } from "@/services/matching/compare-skills"
import { coverageScore, roundScore, weightedOverallScore } from "@/services/matching/score"
import { extractSkills } from "@/services/nlp/skill-extractor"
import { loadSkillDictionary, type SkillDefinition } from "@/services/nlp/skill-dictionary"
import { removeStopwords, tokenize } from "@/services/nlp/preprocess"
import { getOwnedResume, listResumesByUser, type ResumeSummary } from "@/services/resume-service"
import { listJobsForRecommendations } from "@/services/job-service"
import type { Job } from "@/types/job"
import type { JobRecommendation } from "@/types/recommendation"
import type { Resume, WorkExperience } from "@/types/resume"

export const RECOMMENDATION_WEIGHTS = {
  requiredSkills: config.recommendations.weight.requiredSkills,
  preferredSkills: config.recommendations.weight.preferredSkills,
  experience: config.recommendations.weight.experience,
  relevance: config.recommendations.weight.relevance,
} as const

export class RecommendationError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 400, code = "RECOMMENDATION_ERROR") {
    super(message)
    this.name = "RecommendationError"
    this.status = status
    this.code = code
  }
}

export type RankedRecommendation = JobRecommendation

export type RecommendJobsResult = {
  resume: Pick<ResumeSummary, "id" | "fileName" | "analysisStatus"> & { skillCount: number }
  recommendations: RankedRecommendation[]
}

type RecommendDependencies = {
  getOwnedResume: typeof getOwnedResume
  listResumesByUser: typeof listResumesByUser
  listJobsForRecommendations: typeof listJobsForRecommendations
}

const defaultDependencies: RecommendDependencies = {
  getOwnedResume,
  listResumesByUser,
  listJobsForRecommendations,
}

const TITLE_NOISE = new Set([
  "senior",
  "junior",
  "staff",
  "lead",
  "principal",
  "intern",
  "internship",
  "remote",
  "hybrid",
  "contract",
  "full",
  "part",
  "time",
  "developer",
  "engineer",
  "engineering",
])

export function yearsFromText(text: string): number | null {
  const matches = [...text.matchAll(/(\d+)\s*\+?\s*years?/gi)]
  if (!matches.length) return null
  return Math.max(...matches.map((match) => Number(match[1])))
}

export function titleTokens(title: string): string[] {
  return removeStopwords(tokenize(title)).filter(
    (token) => token.length >= 3 && !TITLE_NOISE.has(token)
  )
}

function tokenCoverage(tokens: string[], haystack: string): number {
  if (!tokens.length) return 50
  const blob = haystack.toLowerCase()
  const hits = tokens.filter((token) => blob.includes(token)).length
  return coverageScore(hits, tokens.length)
}

function experienceBlob(experience: WorkExperience[], resumeText?: string): string {
  return [
    ...experience.map((item) =>
      [item.position, item.company, item.description].filter(Boolean).join(" ")
    ),
    resumeText?.trim() ?? "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function experienceCompatibilityScore(input: {
  experience?: WorkExperience[]
  resumeText?: string
  experienceSkills?: string[]
  jobTitle: string
  jobDescription: string
  requiredSkills: string[]
}): number {
  const blob = experienceBlob(input.experience ?? [], input.resumeText)
  const resumeYears = yearsFromText(blob)
  const jobYears = yearsFromText(input.jobDescription)

  let yearsScore = 50
  if (resumeYears != null && jobYears != null) {
    yearsScore = roundScore(Math.min(100, (resumeYears / Math.max(jobYears, 1)) * 100))
  } else if (resumeYears != null) {
    yearsScore = resumeYears >= 3 ? 75 : resumeYears >= 1 ? 60 : 50
  }

  const roleHaystack = (input.experience ?? [])
    .map((item) => item.position)
    .filter(Boolean)
    .join(" ")
  const titleScore = tokenCoverage(
    titleTokens(input.jobTitle),
    roleHaystack || blob
  )

  let experienceSkillScore = 50
  if (input.experienceSkills?.length && input.requiredSkills.length) {
    const comparison = compareSkills(input.experienceSkills, input.requiredSkills)
    experienceSkillScore = coverageScore(
      comparison.matchedSkills.length,
      input.requiredSkills.length
    )
  }

  return roundScore(yearsScore * 0.4 + titleScore * 0.3 + experienceSkillScore * 0.3)
}

export function jobRelevanceScore(input: {
  resumeSkills: string[]
  jobTitle: string
  requiredSkills: string[]
  dictionary?: SkillDefinition[]
}): number {
  const titleSkills = extractSkills(input.jobTitle, input.dictionary).map((skill) => skill.name)
  if (titleSkills.length) {
    const comparison = compareSkills(input.resumeSkills, titleSkills)
    return coverageScore(comparison.matchedSkills.length, titleSkills.length)
  }

  return tokenCoverage(titleTokens(input.jobTitle), input.resumeSkills.join(" "))
}

export function scoreJobRecommendation(input: {
  resumeId: string
  resumeSkills: string[]
  experience?: WorkExperience[]
  resumeText?: string
  experienceSkills?: string[]
  job: Job
  dictionary?: SkillDefinition[]
}): RankedRecommendation | null {
  if (!input.job.requiredSkills.length) return null

  const comparison = calculateMatch({
    resumeSkills: input.resumeSkills,
    requiredSkills: input.job.requiredSkills,
    preferredSkills: input.job.preferredSkills,
  })

  if (
    comparison.matchedSkills.length < config.recommendations.minMatchedRequiredSkills ||
    comparison.skillScore < config.recommendations.minRequiredCoverage
  ) {
    return null
  }

  const preferredTotal =
    comparison.preferredMatchedSkills.length + comparison.preferredMissingSkills.length
  const preferredScore =
    preferredTotal > 0
      ? coverageScore(comparison.preferredMatchedSkills.length, preferredTotal)
      : 100

  const experienceScore = experienceCompatibilityScore({
    experience: input.experience,
    resumeText: input.resumeText,
    experienceSkills: input.experienceSkills,
    jobTitle: input.job.title,
    jobDescription: input.job.description,
    requiredSkills: input.job.requiredSkills,
  })

  const relevanceScore = jobRelevanceScore({
    resumeSkills: input.resumeSkills,
    jobTitle: input.job.title,
    requiredSkills: input.job.requiredSkills,
    dictionary: input.dictionary,
  })

  const overallScore = weightedOverallScore([
    {
      score: comparison.skillScore,
      weight: RECOMMENDATION_WEIGHTS.requiredSkills,
      enabled: true,
    },
    {
      score: preferredScore,
      weight: RECOMMENDATION_WEIGHTS.preferredSkills,
      enabled: true,
    },
    {
      score: experienceScore,
      weight: RECOMMENDATION_WEIGHTS.experience,
      enabled: true,
    },
    {
      score: relevanceScore,
      weight: RECOMMENDATION_WEIGHTS.relevance,
      enabled: true,
    },
  ])

  if (overallScore < config.recommendations.minOverallScore) return null

  return {
    jobId: input.job.id,
    resumeId: input.resumeId,
    overallScore,
    skillScore: comparison.skillScore,
    preferredScore,
    experienceScore,
    relevanceScore,
    matchedSkills: comparison.matchedSkills,
    missingSkills: comparison.missingSkills,
    preferredMatchedSkills: comparison.preferredMatchedSkills,
    job: {
      id: input.job.id,
      title: input.job.title,
      company: input.job.company,
      location: input.job.location,
      employmentType: input.job.employmentType,
      source: input.job.source,
      sourceUrl: input.job.sourceUrl ?? null,
    },
  }
}

export function rankJobRecommendations(
  resume: Pick<Resume, "id" | "skills" | "experience" | "extractedText">,
  jobs: Job[],
  dictionary: SkillDefinition[] = loadSkillDictionary()
): RankedRecommendation[] {
  const experienceSkills = extractSkills(
    experienceBlob(resume.experience ?? [], resume.extractedText),
    dictionary
  ).map((skill) => skill.name)

  return jobs
    .map((job) =>
      scoreJobRecommendation({
        resumeId: resume.id,
        resumeSkills: resume.skills,
        experience: resume.experience,
        resumeText: resume.extractedText,
        experienceSkills,
        job,
        dictionary,
      })
    )
    .filter((item): item is RankedRecommendation => Boolean(item))
    .sort((a, b) => {
      if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore
      if (b.skillScore !== a.skillScore) return b.skillScore - a.skillScore
      return a.job.title.localeCompare(b.job.title)
    })
    .slice(0, config.recommendations.limit)
}

function pickDefaultResume(resumes: ResumeSummary[]): ResumeSummary | null {
  return (
    resumes.find((resume) => resume.analysisStatus === "completed" && resume.skills.length > 0) ??
    resumes.find((resume) => resume.skills.length > 0) ??
    null
  )
}

export async function recommendJobsForUser(
  userId: string,
  resumeId?: string,
  deps: RecommendDependencies = defaultDependencies
): Promise<RecommendJobsResult> {
  let resume: Resume | null = null

  if (resumeId?.trim()) {
    if (!isValidObjectId(resumeId)) {
      throw new RecommendationError("A valid resume is required.", 400, "INVALID_RESUME")
    }
    resume = await deps.getOwnedResume(resumeId, userId)
    if (!resume) {
      throw new RecommendationError("Resume not found.", 404, "RESUME_NOT_FOUND")
    }
  } else {
    const resumes = await deps.listResumesByUser(userId)
    const selected = pickDefaultResume(resumes)
    if (!selected) {
      throw new RecommendationError(
        "Upload and analyze a resume before requesting job recommendations.",
        400,
        "RESUME_REQUIRED"
      )
    }
    resume = await deps.getOwnedResume(selected.id, userId)
  }

  if (!resume) {
    throw new RecommendationError("Resume not found.", 404, "RESUME_NOT_FOUND")
  }

  if (!resume.skills.length) {
    throw new RecommendationError(
      "This resume has no extracted skills. Analyze the resume first.",
      400,
      "RESUME_NOT_ANALYZED"
    )
  }

  const jobs = await deps.listJobsForRecommendations(
    userId,
    config.recommendations.jobPoolLimit
  )
  const recommendations = rankJobRecommendations(resume, jobs)

  return {
    resume: {
      id: resume.id,
      fileName: resume.fileName,
      analysisStatus: resume.analysisStatus,
      skillCount: resume.skills.length,
    },
    recommendations,
  }
}
