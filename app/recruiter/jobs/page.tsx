import Link from "next/link"
import { requireRole } from "@/lib/auth-utils"
import { listRecruiterJobs } from "@/services/recruiter/recruiter-job-service"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RecruiterJobActions } from "@/components/recruiter/recruiter-job-actions"
import { formatEmploymentType } from "@/services/jobs/normalize-job"
import { Briefcase, Plus } from "lucide-react"

export default async function RecruiterJobsPage() {
  const user = await requireRole(["recruiter", "admin"])
  const jobs = await listRecruiterJobs(user.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="My Jobs"
          description="Create, edit, and activate job postings for your organization."
          icon={Briefcase}
        />
        <Button asChild className="sm:mt-1">
          <Link href="/recruiter/jobs/new">
            <Plus className="h-4 w-4" />
            Create job
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs posted yet"
          description="Post a job with required skills so candidates can apply and be ranked."
          actionText="Create Job"
          actionHref="/recruiter/jobs/new"
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <h2 className="text-lg font-semibold">{job.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {job.company} · {job.location} · {formatEmploymentType(job.employmentType)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {job.requiredSkills.length} required skill{job.requiredSkills.length === 1 ? "" : "s"}
                    {job.preferredSkills.length
                      ? ` · ${job.preferredSkills.length} preferred`
                      : ""}
                  </p>
                </div>
                <RecruiterJobActions job={job} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
