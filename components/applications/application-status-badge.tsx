import { Badge } from "@/components/ui/badge"
import {
  applicationStatusBadgeVariant,
  applicationStatusLabel,
} from "@/services/applications/status"
import type { ApplicationStatus } from "@/types/application"

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge variant={applicationStatusBadgeVariant(status)}>
      {applicationStatusLabel(status)}
    </Badge>
  )
}
