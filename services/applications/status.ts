import type { ApplicationStatus } from "@/types/application"
import { APPLICATION_STATUS_VALUES } from "@/types/application"

export const APPLICATION_STATUS_ORDER = [
  "saved",
  "applied",
  "interview",
  "offered",
  "rejected",
] as const satisfies readonly ApplicationStatus[]

export type ApplicationStatusCounts = Record<ApplicationStatus, number>

export const EMPTY_APPLICATION_COUNTS: ApplicationStatusCounts = {
  saved: 0,
  applied: 0,
  interview: 0,
  offered: 0,
  rejected: 0,
}

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUS_VALUES as readonly string[]).includes(value)
}

export function applicationStatusLabel(status: ApplicationStatus): string {
  const labels: Record<ApplicationStatus, string> = {
    saved: "Saved",
    applied: "Applied",
    interview: "Interview",
    offered: "Offered",
    rejected: "Rejected",
  }
  return labels[status]
}

export function applicationStatusBadgeVariant(
  status: ApplicationStatus
): "secondary" | "default" | "warning" | "success" | "destructive" {
  if (status === "saved") return "secondary"
  if (status === "applied") return "default"
  if (status === "interview") return "warning"
  if (status === "offered") return "success"
  return "destructive"
}

export function emptyApplicationCounts(): ApplicationStatusCounts {
  return { ...EMPTY_APPLICATION_COUNTS }
}
