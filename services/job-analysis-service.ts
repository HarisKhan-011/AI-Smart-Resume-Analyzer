import { extractJobSkills, type JobSkillExtraction } from "@/services/nlp/job-skill-extractor"
import {
  createJob,
  findDuplicateJob,
  updateJob,
  type CreateJobInput,
} from "@/services/job-service"
import { jobAnalyzeSchema } from "@/lib/validations"
import type { Job } from "@/types/job"

export class JobAnalysisError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 400, code = "JOB_ANALYSIS_ERROR") {
    super(message)
    this.name = "JobAnalysisError"
    this.status = status
    this.code = code
  }
}

export type AnalyzeJobInput = {
  title: string
  company: string
  location?: string
  description: string
}

export type AnalyzeJobResult = {
  job: Job
  requiredSkills: string[]
  preferredSkills: string[]
  detectedSkills: JobSkillExtraction["detectedSkills"]
  technicalSkills: JobSkillExtraction["technicalSkills"]
  toolSkills: JobSkillExtraction["toolSkills"]
  alreadyExists: boolean
}

type AnalyzeDependencies = {
  extractJobSkills: typeof extractJobSkills
  createJob: typeof createJob
  updateJob: typeof updateJob
  findDuplicateJob: typeof findDuplicateJob
}

const defaultDependencies: AnalyzeDependencies = {
  extractJobSkills,
  createJob,
  updateJob,
  findDuplicateJob,
}

function hasEnoughContent(description: string): boolean {
  const letters = description.replace(/[^A-Za-z]/g, "")
  return letters.length >= 25
}

export async function analyzeJobDescription(
  input: AnalyzeJobInput,
  userId: string,
  deps: AnalyzeDependencies = defaultDependencies
): Promise<AnalyzeJobResult> {
  const parsed = jobAnalyzeSchema.safeParse(input)
  if (!parsed.success) {
    throw new JobAnalysisError(
      parsed.error.issues[0]?.message ?? "Invalid job details.",
      400,
      "INVALID_INPUT"
    )
  }

  const data = parsed.data
  if (!hasEnoughContent(data.description)) {
    throw new JobAnalysisError(
      "This job description is too short or not readable enough to analyze.",
      400,
      "DESCRIPTION_TOO_SHORT"
    )
  }

  const extracted = deps.extractJobSkills(data.description)
  const location = data.location?.trim() || "Not specified"
  const payload: CreateJobInput = {
    title: data.title,
    company: data.company,
    location,
    description: data.description,
    requiredSkills: extracted.requiredSkills,
    preferredSkills: extracted.preferredSkills,
    source: "manual",
    createdBy: userId,
  }

  const duplicate = await deps.findDuplicateJob({
    userId,
    title: data.title,
    company: data.company,
    description: data.description,
  })

  const job = duplicate
    ? await deps.updateJob(duplicate.id, {
        requiredSkills: extracted.requiredSkills,
        preferredSkills: extracted.preferredSkills,
        location,
      })
    : await deps.createJob(payload)

  if (!job) {
    throw new JobAnalysisError("Unable to save the analyzed job.", 500, "SAVE_FAILED")
  }

  return {
    job,
    requiredSkills: extracted.requiredSkills,
    preferredSkills: extracted.preferredSkills,
    detectedSkills: extracted.detectedSkills,
    technicalSkills: extracted.technicalSkills,
    toolSkills: extracted.toolSkills,
    alreadyExists: Boolean(duplicate),
  }
}
