import { isValidObjectId } from "mongoose"
import { dbConnect } from "@/lib/mongodb"
import { toStringId } from "@/lib/serialize"
import { Job, type JobDocument } from "@/models/job"
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
