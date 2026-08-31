import { isValidObjectId, Types } from "mongoose"
import { dbConnect } from "@/lib/mongodb"
import { toStringId } from "@/lib/serialize"
import { Application, type ApplicationDocument } from "@/models/application"
import { Job } from "@/models/job"
import { Match } from "@/models/match"
import { getAccessibleJob } from "@/services/job-service"
import {
  emptyApplicationCounts,
  isApplicationStatus,
  type ApplicationStatusCounts,
} from "@/services/applications/status"
import type { Application as ApplicationDTO, ApplicationStatus } from "@/types/application"

export const MAX_APPLICATION_NOTES_LENGTH = 2000

export class ApplicationError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 400, code = "APPLICATION_ERROR") {
    super(message)
    this.name = "ApplicationError"
    this.status = status
    this.code = code
  }
}

export type ApplicationJobSummary = {
  id: string
  title: string
  company: string
  location: string
  employmentType: string
}

export type ApplicationWithJob = ApplicationDTO & {
  job: ApplicationJobSummary | null
  matchScore: number | null
}

export type TrackApplicationInput = {
  jobId: string
  status?: string
  notes?: string
}

export type UpdateOwnedApplicationInput = {
  status?: string
  notes?: string
}

function toApplicationDTO(application: ApplicationDocument): ApplicationDTO {
  return {
    id: toStringId(application._id),
    userId: toStringId(application.userId),
    jobId: toStringId(application.jobId),
    status: application.status,
    appliedAt: application.appliedAt ?? null,
    notes: application.notes ?? "",
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && Number(error.code) === 11000
  )
}

export function appliedAtForStatus(
  status: ApplicationStatus,
  currentAppliedAt?: Date | null
): Date | null {
  if (currentAppliedAt) return currentAppliedAt
  if (status === "applied" || status === "interview" || status === "offered") {
    return new Date()
  }
  return null
}

function normalizeNotes(notes: string | undefined): string | undefined {
  if (notes === undefined) return undefined
  const trimmed = notes.trim()
  if (trimmed.length > MAX_APPLICATION_NOTES_LENGTH) {
    throw new ApplicationError(
      `Notes must be ${MAX_APPLICATION_NOTES_LENGTH} characters or less.`,
      400,
      "NOTES_TOO_LONG"
    )
  }
  return trimmed
}

function requireStatus(value: string | undefined): ApplicationStatus {
  if (!value) {
    throw new ApplicationError("Application status is required.", 400, "INVALID_STATUS")
  }
  if (!isApplicationStatus(value)) {
    throw new ApplicationError("Invalid application status.", 400, "INVALID_STATUS")
  }
  return value
}

export async function getOwnedApplication(
  id: string,
  userId: string
): Promise<ApplicationDTO | null> {
  if (!isValidObjectId(id) || !isValidObjectId(userId)) return null
  await dbConnect()
  const application = await Application.findOne({ _id: id, userId })
  return application ? toApplicationDTO(application) : null
}

export async function getApplicationByUserAndJob(
  userId: string,
  jobId: string
): Promise<ApplicationDTO | null> {
  if (!isValidObjectId(userId) || !isValidObjectId(jobId)) return null
  await dbConnect()
  const application = await Application.findOne({ userId, jobId })
  return application ? toApplicationDTO(application) : null
}

export async function listOwnedApplications(
  userId: string,
  status?: ApplicationStatus
): Promise<ApplicationDTO[]> {
  if (!isValidObjectId(userId)) return []
  await dbConnect()
  const query: Record<string, unknown> = { userId }
  if (status) query.status = status
  const applications = await Application.find(query).sort({ updatedAt: -1 })
  return applications.map(toApplicationDTO)
}

export async function listOwnedApplicationsWithJobs(
  userId: string,
  status?: ApplicationStatus
): Promise<ApplicationWithJob[]> {
  const applications = await listOwnedApplications(userId, status)
  if (applications.length === 0) return []

  const jobIds = applications.map((item) => item.jobId)
  const [jobs, matches] = await Promise.all([
    Job.find({ _id: { $in: jobIds } }),
    Match.find({ userId, jobId: { $in: jobIds } }).sort({ overallScore: -1 }),
  ])

  const jobById = new Map(
    jobs.map((job) => [
      toStringId(job._id),
      {
        id: toStringId(job._id),
        title: job.title,
        company: job.company,
        location: job.location,
        employmentType: job.employmentType,
      } satisfies ApplicationJobSummary,
    ])
  )

  const matchByJobId = new Map<string, number>()
  for (const match of matches) {
    const key = toStringId(match.jobId)
    if (!matchByJobId.has(key)) matchByJobId.set(key, match.overallScore)
  }

  return applications.map((application) => ({
    ...application,
    job: jobById.get(application.jobId) ?? null,
    matchScore: matchByJobId.get(application.jobId) ?? null,
  }))
}

export async function countOwnedApplicationsByStatus(
  userId: string
): Promise<ApplicationStatusCounts> {
  const counts = emptyApplicationCounts()
  if (!isValidObjectId(userId)) return counts
  await dbConnect()

  const grouped = await Application.aggregate<{ _id: ApplicationStatus; count: number }>([
    { $match: { userId: new Types.ObjectId(userId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ])

  for (const row of grouped) {
    if (isApplicationStatus(row._id)) {
      counts[row._id] = row.count
    }
  }

  return counts
}

export async function trackOwnedApplication(
  userId: string,
  input: TrackApplicationInput
): Promise<{ application: ApplicationDTO; alreadyExists: boolean }> {
  if (!isValidObjectId(userId)) {
    throw new ApplicationError("You must be signed in to track an application.", 401, "UNAUTHORIZED")
  }
  if (!isValidObjectId(input.jobId)) {
    throw new ApplicationError("A valid job is required.", 400, "INVALID_JOB")
  }

  const job = await getAccessibleJob(input.jobId, userId)
  if (!job) {
    throw new ApplicationError("Job not found.", 404, "JOB_NOT_FOUND")
  }

  const requested = input.status ? requireStatus(input.status) : "saved"
  const notes = normalizeNotes(input.notes)
  const existing = await getApplicationByUserAndJob(userId, input.jobId)

  if (existing) {
    let status = existing.status
    if (requested === "applied" && (existing.status === "saved" || existing.status === "rejected")) {
      status = "applied"
    }
    const nextNotes = notes ?? existing.notes ?? ""
    if (status === existing.status && nextNotes === (existing.notes ?? "")) {
      return { application: existing, alreadyExists: true }
    }
    const updated = await updateOwnedApplication(existing.id, userId, {
      status,
      notes: nextNotes,
    })
    return { application: updated, alreadyExists: true }
  }

  await dbConnect()
  try {
    const application = await Application.create({
      userId,
      jobId: input.jobId,
      status: requested,
      notes: notes ?? "",
      appliedAt: appliedAtForStatus(requested),
    })
    return { application: toApplicationDTO(application), alreadyExists: false }
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error
    const duplicate = await getApplicationByUserAndJob(userId, input.jobId)
    if (!duplicate) throw error
    return { application: duplicate, alreadyExists: true }
  }
}

export async function updateOwnedApplication(
  id: string,
  userId: string,
  input: UpdateOwnedApplicationInput
): Promise<ApplicationDTO> {
  if (!isValidObjectId(id)) {
    throw new ApplicationError("A valid application is required.", 400, "INVALID_APPLICATION")
  }

  const current = await getOwnedApplication(id, userId)
  if (!current) {
    throw new ApplicationError("Application not found.", 404, "NOT_FOUND")
  }

  if (input.status === undefined && input.notes === undefined) {
    throw new ApplicationError("Status or notes are required.", 400, "EMPTY_UPDATE")
  }

  const status = input.status ? requireStatus(input.status) : current.status
  const notes = input.notes !== undefined ? normalizeNotes(input.notes) : current.notes

  await dbConnect()
  const application = await Application.findOneAndUpdate(
    { _id: id, userId },
    {
      status,
      notes: notes ?? "",
      appliedAt: appliedAtForStatus(status, current.appliedAt),
    },
    { new: true }
  )

  if (!application) {
    throw new ApplicationError("Application not found.", 404, "NOT_FOUND")
  }

  return toApplicationDTO(application)
}

export async function deleteOwnedApplication(id: string, userId: string): Promise<boolean> {
  if (!isValidObjectId(id)) {
    throw new ApplicationError("A valid application is required.", 400, "INVALID_APPLICATION")
  }
  if (!isValidObjectId(userId)) {
    throw new ApplicationError("Application not found.", 404, "NOT_FOUND")
  }

  await dbConnect()
  const result = await Application.findOneAndDelete({ _id: id, userId })
  if (!result) {
    throw new ApplicationError("Application not found.", 404, "NOT_FOUND")
  }
  return true
}
