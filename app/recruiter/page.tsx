import Link from "next/link"
import { requireRole } from "@/lib/auth-utils"
import { recruiterDashboardStats } from "@/services/recruiter/recruiter-candidate-service"
import { StatCard } from "@/components/dashboard/stat-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatEmploymentType } from "@/services/jobs/normalize-job"
import { Briefcase, Users, ClipboardList, Target, Building2, Plus } from "lucide-react"

export default async function RecruiterPage() {
  const user = await requireRole(["recruiter", "admin"])
  const stats = await recruiterDashboardStats(user.id)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Recruiter Dashboard"
          description="Manage jobs, review applicants, and rank candidates by skill match."
          icon={Building2}
        />
        <Button asChild className="sm:mt-1">
          <Link href="/recruiter/jobs/new">
            <Plus className="h-4 w-4" />
            Create job
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Jobs"
          value={stats.activeJobs}
          icon={Briefcase}
          description={stats.totalJobs ? `${stats.totalJobs} posted` : "No jobs posted"}
        />
        <StatCard
          title="Total Candidates"
          value={stats.totalCandidates}
          icon={Users}
          description={stats.totalCandidates ? "Unique applicants" : "No candidates yet"}
        />
        <StatCard
          title="Applications"
          value={stats.totalApplications}
          icon={ClipboardList}
          description={stats.totalApplications ? "Applied to your jobs" : "Not tracked yet"}
        />
        <StatCard
          title="Top Candidates"
          value={stats.topMatch != null ? `${stats.topMatch}%` : "--%"}
          icon={Target}
          description={stats.topMatch != null ? "Best skill match" : "No rankings yet"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Jobs</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/recruiter/jobs">Manage Jobs</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentJobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No jobs posted yet"
                description="Create your first job posting to start receiving candidates."
                actionText="Create Job"
                actionHref="/recruiter/jobs/new"
              />
            ) : (
              <ul className="divide-y">
                {stats.recentJobs.map((job) => (
                  <li key={job.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.company} · {job.location} · {formatEmploymentType(job.employmentType)}
                      </p>
                    </div>
                    <Badge variant={job.isActive !== false ? "success" : "secondary"}>
                      {job.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Top Candidates</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/recruiter/candidates">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.topCandidates.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No candidates yet"
                description="When candidates apply to your jobs, they will appear here ranked by match."
                actionText="View Candidates"
                actionHref="/recruiter/candidates"
              />
            ) : (
              <ul className="divide-y">
                {stats.topCandidates.map((candidate) => (
                  <li key={`${candidate.candidateId}-${candidate.jobId}`} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{candidate.candidateName}</p>
                      <p className="text-sm text-muted-foreground">{candidate.jobTitle}</p>
                    </div>
                    <Badge variant={candidate.matchScore >= 80 ? "success" : "secondary"}>
                      {candidate.matchScore}%
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
