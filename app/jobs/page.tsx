import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { listJobsByUser } from "@/services/job-service"
import { JobCard } from "@/components/jobs/job-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Briefcase, Search } from "lucide-react"

export default async function JobsPage() {
  const user = await requireAuth()
  const jobs = await listJobsByUser(user.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Jobs"
          description="Job descriptions you have analyzed."
          icon={Briefcase}
        />
        <Button asChild className="sm:mt-1">
          <Link href="/job-match">
            <Search className="h-4 w-4" />
            Analyze Job
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs analyzed yet."
          description="Paste a job description to extract required and preferred skills."
          actionText="Analyze Job"
          actionHref="/job-match"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              id={job.id}
              title={job.title}
              company={job.company}
              location={job.location}
              skills={job.requiredSkills}
              postedAt={job.createdAt}
              href={`/jobs/${job.id}`}
              requiredSkillCount={job.requiredSkills.length}
            />
          ))}
        </div>
      )}
    </div>
  )
}
