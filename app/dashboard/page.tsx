import { requireAuth } from "@/lib/auth-utils"
import { loadCareerIntelligence } from "@/services/dashboard/career-intelligence"
import { CareerIntelligenceDashboard } from "@/components/dashboard/career-intelligence"
import { PageHeader } from "@/components/shared/page-header"
import { LayoutDashboard } from "lucide-react"

export default async function DashboardPage() {
  const user = await requireAuth()
  const data = await loadCareerIntelligence(user.id)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Career Dashboard"
        description="Live ATS, match, skill, and application stats from your saved ResumeAI data."
        icon={LayoutDashboard}
      />
      <CareerIntelligenceDashboard data={data} />
    </div>
  )
}
