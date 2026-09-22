import { isValidObjectId } from "mongoose"
import { dbConnect } from "@/lib/mongodb"
import { toStringId } from "@/lib/serialize"
import { Job, type JobDocument } from "@/models/job"
import { isPakistanJob } from "@/services/jobs/normalize-job"
import type { EmploymentType, Job as JobDTO, JobSource } from "@/types/job"

export type CreateJobInput = {
  title: string
  company: string
  location: string
  description: string
  requiredSkills?: string[]
  preferredSkills?: string[]
  employmentType?: EmploymentType
  source?: JobSource
  sourceUrl?: string | null
  postedDate?: Date
  isPosted?: boolean
  isActive?: boolean
  createdBy?: string | null
}

export type UpdateJobInput = Partial<CreateJobInput>

function toJobDTO(job: JobDocument): JobDTO {
  return {
    id: toStringId(job._id),
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    requiredSkills: job.requiredSkills ?? [],
    preferredSkills: job.preferredSkills ?? [],
    employmentType: job.employmentType,
    source: job.source,
    sourceUrl: job.sourceUrl ?? null,
    postedDate: job.postedDate,
    isPosted: job.isPosted ?? false,
    isActive: job.isActive !== false,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    createdBy: job.createdBy ? toStringId(job.createdBy) : null,
  }
}

export async function createJob(input: CreateJobInput): Promise<JobDTO> {
  await dbConnect()
  const job = await Job.create({
    title: input.title,
    company: input.company,
    location: input.location,
    description: input.description,
    requiredSkills: input.requiredSkills ?? [],
    preferredSkills: input.preferredSkills ?? [],
    employmentType: input.employmentType ?? "full-time",
    source: input.source ?? "manual",
    sourceUrl: input.sourceUrl ?? null,
    postedDate: input.postedDate ?? new Date(),
    isPosted: input.isPosted ?? false,
    isActive: input.isActive ?? true,
    createdBy: input.createdBy ?? null,
  })
  return toJobDTO(job)
}

export async function getJobById(id: string): Promise<JobDTO | null> {
  if (!isValidObjectId(id)) return null
  await dbConnect()
  const job = await Job.findById(id)
  return job ? toJobDTO(job) : null
}

export async function getOwnedJob(id: string, userId: string): Promise<JobDTO | null> {
  if (!isValidObjectId(id)) return null
  await dbConnect()
  const job = await Job.findOne({ _id: id, createdBy: userId })
  return job ? toJobDTO(job) : null
}

export function canAccessJob(
  job: Pick<JobDTO, "createdBy" | "source" | "isPosted" | "isActive">,
  userId: string
): boolean {
  if (job.source === "api" || job.source === "scrape") return false
  if (job.createdBy === userId) return true
  return Boolean(job.isPosted) && job.isActive !== false
}

export async function getAccessibleJob(id: string, userId: string): Promise<JobDTO | null> {
  const job = await getJobById(id)
  if (!job || !canAccessJob(job, userId)) return null
  return job
}

export async function listAccessibleJobs(userId: string): Promise<JobDTO[]> {
  await dbConnect()
  const jobs = await Job.find({
    source: { $nin: ["api", "scrape"] },
    $or: [
      { createdBy: userId },
      { isPosted: true, isActive: { $ne: false } },
    ],
  })
    .sort({ postedDate: -1, createdAt: -1 })
    .limit(80)
  return jobs.map(toJobDTO)
}

export async function listJobsForRecommendations(
  userId: string,
  limit = 120
): Promise<JobDTO[]> {
  await dbConnect()
  const jobs = await Job.find({
    source: { $nin: ["api", "scrape"] },
    $or: [
      { createdBy: userId },
      { isPosted: true, isActive: { $ne: false } },
    ],
    requiredSkills: { $exists: true, $ne: [] },
  })
    .sort({ postedDate: -1, createdAt: -1 })
    .limit(limit)
  return jobs.map(toJobDTO).filter((job) => isPakistanJob(job.location))
}

export async function listPublicJobs(_options?: {
  limit?: number
  employmentType?: string
}): Promise<JobDTO[]> {
  return []
}

export async function deleteImportedJobListings(): Promise<number> {
  await dbConnect()
  const result = await Job.deleteMany({ source: { $in: ["api", "scrape"] } })
  return result.deletedCount ?? 0
}

export async function upsertJobBySource(input: CreateJobInput): Promise<JobDTO> {
  await dbConnect()
  const sourceUrl = input.sourceUrl?.trim()
  if (!sourceUrl) {
    return createJob(input)
  }

  const payload = {
    title: input.title,
    company: input.company,
    location: input.location,
    description: input.description,
    requiredSkills: input.requiredSkills ?? [],
    preferredSkills: input.preferredSkills ?? [],
    employmentType: input.employmentType ?? "full-time",
    source: input.source ?? "api",
    sourceUrl,
    postedDate: input.postedDate ?? new Date(),
    createdBy: input.createdBy ?? null,
    isPosted: false,
    isActive: true,
  }

  try {
    const job = await Job.findOneAndUpdate(
      { source: payload.source, sourceUrl },
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )

    if (!job) {
      throw new Error("Unable to save job listing.")
    }

    return toJobDTO(job)
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? Number(error.code) : 0
    if (code === 11000) {
      const existing = await Job.findOne({ source: payload.source, sourceUrl })
      if (existing) return toJobDTO(existing)
    }
    throw error
  }
}

export async function listJobsByUser(userId: string): Promise<JobDTO[]> {
  await dbConnect()
  const jobs = await Job.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(50)
  return jobs.map(toJobDTO)
}

export function normalizeJobDescription(description: string): string {
  return description.toLowerCase().replace(/\s+/g, " ").trim()
}

export async function findDuplicateJob(input: {
  userId: string
  title: string
  company: string
  description: string
}): Promise<JobDTO | null> {
  await dbConnect()
  const candidates = await Job.find({
    createdBy: input.userId,
    title: input.title.trim(),
    company: input.company.trim(),
  }).limit(20)

  const needle = normalizeJobDescription(input.description)
  const match = candidates.find(
    (job) => normalizeJobDescription(job.description) === needle
  )
  return match ? toJobDTO(match) : null
}

export async function listJobs(options?: {
  limit?: number
  skip?: number
}): Promise<JobDTO[]> {
  await dbConnect()
  const jobs = await Job.find()
    .sort({ postedDate: -1 })
    .skip(options?.skip ?? 0)
    .limit(options?.limit ?? 50)
  return jobs.map(toJobDTO)
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<JobDTO | null> {
  if (!isValidObjectId(id)) return null
  await dbConnect()
  const job = await Job.findByIdAndUpdate(id, input, { new: true })
  return job ? toJobDTO(job) : null
}

export async function deleteJob(id: string): Promise<boolean> {
  await dbConnect()
  const result = await Job.findByIdAndDelete(id)
  return Boolean(result)
}
