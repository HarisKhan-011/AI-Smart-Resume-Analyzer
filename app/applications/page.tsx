import { requireAuth } from "@/lib/auth-utils"
import { listOwnedApplicationsWithJobs } from "@/services/applications/application-service"
import { ApplicationsBoard } from "@/components/applications/applications-board"
import { PageHeader } from "@/components/shared/page-header"
import { ClipboardList } from "lucide-react"

interface ApplicationsPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const user = await requireAuth()
  const params = await searchParams
  const items = await listOwnedApplicationsWithJobs(user.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Save jobs, track applications, and update status as you move through the process."
        icon={ClipboardList}
      />
      <ApplicationsBoard initialItems={items} initialStatus={params.status?.trim() || "all"} />
    </div>
  )
}
