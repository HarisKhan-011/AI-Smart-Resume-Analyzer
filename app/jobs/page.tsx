import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { JobSearchPanel } from "@/components/jobs/job-search-panel"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Briefcase, Search } from "lucide-react"

interface JobsPageProps {
  searchParams: Promise<{
    keyword?: string
    location?: string
    jobType?: string
  }>
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  await requireAuth()
  const params = await searchParams

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Search Jobs"
          description="Find live listings, extract skills, and save them for resume matching."
          icon={Briefcase}
        />
        <Button asChild variant="outline" className="sm:mt-1">
          <Link href="/job-match">
            <Search className="h-4 w-4" />
            Analyze Job
          </Link>
        </Button>
      </div>

      <JobSearchPanel
        initialKeyword={params.keyword ?? ""}
        initialLocation={params.location ?? ""}
        initialJobType={params.jobType ?? "all"}
      />
    </div>
  )
}
