import { requireRole } from "@/lib/auth-utils"
import { dbConnect } from "@/lib/mongodb"
import { User } from "@/models/user"
import { Job } from "@/models/job"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Briefcase, Building2 } from "lucide-react"

export default async function AdminPage() {
  await requireRole("admin")
  await dbConnect()

  const [userCount, recruiterCount, postedJobs] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "recruiter" }),
    Job.countDocuments({ isPosted: true }),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="High-level counts from the live database. Public registration cannot create admin accounts."
        icon={Shield}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Users" value={userCount} icon={Users} description="All registered accounts" />
        <StatCard title="Recruiters" value={recruiterCount} icon={Building2} description="Recruiter role" />
        <StatCard title="Posted jobs" value={postedJobs} icon={Briefcase} description="Recruiter listings" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Admin tools</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Role-based access is active. User management screens are not part of this release.
          Use Recruiter Tools from the sidebar to review posted jobs.
        </CardContent>
      </Card>
    </div>
  )
}
