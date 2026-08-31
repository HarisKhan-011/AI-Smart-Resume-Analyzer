import { requireRole } from "@/lib/auth-utils"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Briefcase, Settings } from "lucide-react"

export default async function AdminPage() {
  await requireRole("admin")

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Administrative overview. User management tools will be expanded in a later phase."
        icon={Shield}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Users" value="--" icon={Users} description="Not connected yet" />
        <StatCard title="Jobs" value="--" icon={Briefcase} description="Not connected yet" />
        <StatCard title="Recruiters" value="--" icon={Briefcase} description="Not connected yet" />
        <StatCard title="Settings" value="--" icon={Settings} description="Not connected yet" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Admin tools</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Authentication and role-based access are active. Admin-only user management
          will be added in a later phase. Public registration cannot create admin accounts.
        </CardContent>
      </Card>
    </div>
  )
}
