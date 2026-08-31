export const APPLICATION_STATUS_VALUES = [
  "saved",
  "applied",
  "interview",
  "rejected",
  "offered",
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUS_VALUES)[number]

export interface Application {
  id: string
  userId: string
  jobId: string
  status: ApplicationStatus
  appliedAt?: Date | null
  notes?: string
  createdAt: Date
  updatedAt: Date
}
