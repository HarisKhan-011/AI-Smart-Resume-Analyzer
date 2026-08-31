import { isValidObjectId } from "mongoose"
import { recruiterJobSchema } from "@/lib/validations"
import { dbConnect } from "@/lib/mongodb"
import { Job } from "@/models/job"
import { extractSkills } from "@/services/nlp/skill-extractor"
import { getSkillByName, loadSkillDictionary } from "@/services/nlp/skill-dictionary"
import { uniqueSkillNames } from "@/services/matching/normalize-skills"
import {
  createJob,
  deleteJob,
  getOwnedJob,
  listJobsByUser,
} from "@/services/job-service"
import type { EmploymentType, Job as JobDTO } from "@/types/job"

export class RecruiterError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 400, code = "RECRUITER_ERROR") {
    super(message)
    this.name = "RecruiterError"
    this.status = status
    this.code = code
  }
}

export type RecruiterJobPayload = {
  title?: string
  company?: string
  location?: string
  employmentType?: string
  description?: string
  requiredSkills?: string | string[]
  preferredSkills?: string | string[]
  isActive?: boolean
}

export function parseRecruiterSkills(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(", ") : value ?? ""
  const typed = raw
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  if (!typed.length) return []

  const dictionary = loadSkillDictionary()
  const detected = extractSkills(typed.join(" "), dictionary).map((skill) => skill.name)
  const mapped = typed.map((term) => {
    const exact = getSkillByName(term, dictionary)
    if (exact) return exact.name
    return extractSkills(term, dictionary)[0]?.name ?? term
  })

  return uniqueSkillNames([...detected, ...mapped])
}

function parseJobFields(input: RecruiterJobPayload, partial = false) {
  const parsed = recruiterJobSchema.safeParse({
    title: input.title ?? (partial ? "Placeholder" : ""),
    company: input.company ?? (partial ? "Placeholder" : ""),
    location: input.location ?? (partial ? "Remote" : ""),
    employmentType: input.employmentType ?? "full-time",
    description: input.description ?? (partial ? "Placeholder description for a recruiter job posting." : ""),
    requiredSkills: Array.isArray(input.requiredSkills)
      ? input.requiredSkills.join(", ")
      : input.requiredSkills ?? "",
    preferredSkills: Array.isArray(input.preferredSkills)
      ? input.preferredSkills.join(", ")
      : input.preferredSkills ?? "",
    isActive: input.isActive,
  })

  if (!parsed.success) {
    throw new RecruiterError(
      parsed.error.issues[0]?.message ?? "Invalid job details.",
      400,
      "INVALID_JOB"
    )
  }

  const requiredSkills = parseRecruiterSkills(
    Array.isArray(input.requiredSkills) ? input.requiredSkills : parsed.data.requiredSkills
  )
  const preferredSkills = parseRecruiterSkills(
    Array.isArray(input.preferredSkills) ? input.preferredSkills : parsed.data.preferredSkills
  ).filter(
    (skill) => !requiredSkills.some((required) => required.toLowerCase() === skill.toLowerCase())
  )

  if (!partial && requiredSkills.length === 0) {
    throw new RecruiterError(
      "Add at least one required skill so candidates can be matched.",
      400,
      "SKILLS_REQUIRED"
    )
  }

  return {
    title: parsed.data.title,
    company: parsed.data.company,
    location: parsed.data.location,
    employmentType: parsed.data.employmentType as EmploymentType,
    description: parsed.data.description,
    requiredSkills,
    preferredSkills,
    isActive: parsed.data.isActive,
  }
}

export async function listRecruiterJobs(recruiterId: string): Promise<JobDTO[]> {
  const jobs = await listJobsByUser(recruiterId)
  return jobs.filter((job) => job.isPosted)
}

export async function listActiveRecruiterJobs(recruiterId: string): Promise<JobDTO[]> {
  const jobs = await listRecruiterJobs(recruiterId)
  return jobs.filter((job) => job.isActive !== false)
}

export async function getOwnedPostedJob(
  jobId: string,
  recruiterId: string
): Promise<JobDTO | null> {
  const job = await getOwnedJob(jobId, recruiterId)
  if (!job?.isPosted) return null
  return job
}

export async function createRecruiterJob(
  recruiterId: string,
  input: RecruiterJobPayload
): Promise<JobDTO> {
  if (!isValidObjectId(recruiterId)) {
    throw new RecruiterError("You must be signed in.", 401, "UNAUTHORIZED")
  }

  const fields = parseJobFields(input, false)
  return createJob({
    ...fields,
    isActive: fields.isActive ?? true,
    isPosted: true,
    source: "manual",
    createdBy: recruiterId,
    postedDate: new Date(),
  })
}

export async function updateRecruiterJob(
  jobId: string,
  recruiterId: string,
  input: RecruiterJobPayload
): Promise<JobDTO> {
  const current = await getOwnedPostedJob(jobId, recruiterId)
  if (!current) {
    throw new RecruiterError("Job not found.", 404, "NOT_FOUND")
  }

  const hasContentUpdate =
    input.title !== undefined ||
    input.company !== undefined ||
    input.location !== undefined ||
    input.employmentType !== undefined ||
    input.description !== undefined ||
    input.requiredSkills !== undefined ||
    input.preferredSkills !== undefined

  if (!hasContentUpdate && input.isActive === undefined) {
    throw new RecruiterError("No job updates were provided.", 400, "EMPTY_UPDATE")
  }

  const patch: Record<string, unknown> = {}
  if (hasContentUpdate) {
    const fields = parseJobFields(
      {
        title: input.title ?? current.title,
        company: input.company ?? current.company,
        location: input.location ?? current.location,
        employmentType: input.employmentType ?? current.employmentType,
        description: input.description ?? current.description,
        requiredSkills: input.requiredSkills ?? current.requiredSkills,
        preferredSkills: input.preferredSkills ?? current.preferredSkills,
      },
      false
    )
    patch.title = fields.title
    patch.company = fields.company
    patch.location = fields.location
    patch.employmentType = fields.employmentType
    patch.description = fields.description
    patch.requiredSkills = fields.requiredSkills
    patch.preferredSkills = fields.preferredSkills
  }
  if (input.isActive !== undefined) {
    patch.isActive = input.isActive
  }

  await dbConnect()
  const job = await Job.findOneAndUpdate(
    { _id: jobId, createdBy: recruiterId, isPosted: true },
    patch,
    { new: true }
  )
  if (!job) {
    throw new RecruiterError("Job not found.", 404, "NOT_FOUND")
  }

  const updated = await getOwnedPostedJob(jobId, recruiterId)
  if (!updated) {
    throw new RecruiterError("Job not found.", 404, "NOT_FOUND")
  }
  return updated
}

export async function deleteRecruiterJob(jobId: string, recruiterId: string): Promise<boolean> {
  const current = await getOwnedPostedJob(jobId, recruiterId)
  if (!current) {
    throw new RecruiterError("Job not found.", 404, "NOT_FOUND")
  }
  return deleteJob(jobId)
}
