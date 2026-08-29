import Link from "next/link"
import { StatCard } from "@/components/dashboard/stat-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, Users, ClipboardList, Target, Building2 } from "lucide-react"

export default function RecruiterPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Recruiter Dashboard"
        description="Manage jobs, candidates, and hiring pipeline."
        icon={Building2}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Jobs" value="--" icon={Briefcase} description="No jobs posted" />
        <StatCard title="Candidates" value="--" icon={Users} description="No candidates yet" />
        <StatCard title="Applications" value="--" icon={ClipboardList} description="Not tracked yet" />
        <StatCard title="Top Match" value="--%" icon={Target} description="No rankings yet" />
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
            <EmptyState
              icon={Briefcase}
              title="No jobs posted yet"
              description="Create your first job posting to start receiving candidates."
              actionText="Create Job"
              actionHref="/recruiter/jobs"
            />
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
            <EmptyState
              icon={Users}
              title="No candidates yet"
              description="Upload candidate resumes or wait for applications."
              actionText="View Candidates"
              actionHref="/recruiter/candidates"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Candidate Rankings</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/recruiter/rankings">View Rankings</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Target}
            title="No rankings available"
            description="Add candidates and jobs to generate candidate rankings."
            actionText="View Rankings"
            actionHref="/recruiter/rankings"
          />
        </CardContent>
      </Card>
    </div>
  )
}
