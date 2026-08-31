import { dbConnect } from "@/lib/mongodb"
import { toStringId } from "@/lib/serialize"
import { Application, type ApplicationDocument } from "@/models/application"
import type { Application as ApplicationDTO, ApplicationStatus } from "@/types/application"

export type CreateApplicationInput = {
  userId: string
  jobId: string
  status?: ApplicationStatus
  notes?: string
  appliedAt?: Date | null
}

export type UpdateApplicationInput = {
  status?: ApplicationStatus
  notes?: string
  appliedAt?: Date | null
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

function withAppliedAt(
  status: ApplicationStatus | undefined,
  appliedAt?: Date | null
): Date | null | undefined {
  if (appliedAt !== undefined) return appliedAt
  if (status === "applied" || status === "interview" || status === "offered") {
    return new Date()
  }
  return undefined
}

export async function createApplication(
  input: CreateApplicationInput
): Promise<ApplicationDTO> {
  await dbConnect()
  const status = input.status ?? "saved"
  const application = await Application.create({
    userId: input.userId,
    jobId: input.jobId,
    status,
    notes: input.notes ?? "",
    appliedAt: withAppliedAt(status, input.appliedAt) ?? null,
  })
  return toApplicationDTO(application)
}

export async function getApplicationById(id: string): Promise<ApplicationDTO | null> {
  await dbConnect()
  const application = await Application.findById(id)
  return application ? toApplicationDTO(application) : null
}

export async function getApplicationByUserAndJob(
  userId: string,
  jobId: string
): Promise<ApplicationDTO | null> {
  await dbConnect()
  const application = await Application.findOne({ userId, jobId })
  return application ? toApplicationDTO(application) : null
}

export async function listApplicationsByUser(userId: string): Promise<ApplicationDTO[]> {
  await dbConnect()
  const applications = await Application.find({ userId }).sort({ updatedAt: -1 })
  return applications.map(toApplicationDTO)
}

export async function updateApplication(
  id: string,
  input: UpdateApplicationInput
): Promise<ApplicationDTO | null> {
  await dbConnect()
  const update: UpdateApplicationInput = { ...input }
  if (input.status && input.appliedAt === undefined) {
    const current = await Application.findById(id)
    if (current && !current.appliedAt) {
      update.appliedAt = withAppliedAt(input.status, input.appliedAt) ?? current.appliedAt
    }
  }
  const application = await Application.findByIdAndUpdate(id, update, { new: true })
  return application ? toApplicationDTO(application) : null
}

export async function deleteApplication(id: string): Promise<boolean> {
  await dbConnect()
  const result = await Application.findByIdAndDelete(id)
  return Boolean(result)
}
