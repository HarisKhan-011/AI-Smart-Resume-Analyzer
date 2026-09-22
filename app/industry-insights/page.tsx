import Link from "next/link"
import { Compass } from "lucide-react"
import { requireAuth } from "@/lib/auth-utils"
import { listResumesByUser } from "@/services/resume-service"
import { getUserById } from "@/services/user-service"
import { pickPrimaryResume } from "@/services/dashboard/career-intelligence"
import { buildIndustryInsights } from "@/services/industry-insights/industry-insights-service"
import { IndustryInsightsPanel } from "@/components/industry-insights/industry-insights-panel"
import { IndustryResumeSwitcher } from "@/components/industry-insights/industry-resume-switcher"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"

interface IndustryInsightsPageProps {
  searchParams: Promise<{ resumeId?: string }>
}

export default async function IndustryInsightsPage({ searchParams }: IndustryInsightsPageProps) {
  const user = await requireAuth()
  const params = await searchParams
  const [resumes, profile] = await Promise.all([
    listResumesByUser(user.id),
    getUserById(user.id),
  ])

  const requested = params.resumeId?.trim()
  const selected =
    resumes.find((resume) => resume.id === requested) ?? pickPrimaryResume(resumes)

  const insights = selected
    ? buildIndustryInsights({
        resumeId: selected.id,
        resumeFileName: selected.fileName,
        skills: selected.skills ?? [],
        roleHints: [
          profile?.title ?? "",
          ...(selected.experience ?? []).map((item) => item.position),
        ],
      })
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Industry Insights"
          description="See how skills already on your resume line up with a target industry. Outlook and salary bands are a curated baseline, not a live job feed."
          icon={Compass}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {selected && (
            <IndustryResumeSwitcher
              resumes={resumes.map((resume) => ({ id: resume.id, fileName: resume.fileName }))}
              currentId={selected.id}
            />
          )}
          <Button asChild variant="outline" className="sm:mb-0.5">
            <Link href="/skill-gap">Skill Gap</Link>
          </Button>
        </div>
      </div>
      <IndustryInsightsPanel insights={insights} />
    </div>
  )
}
