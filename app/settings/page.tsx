import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getRoleLabel } from "@/lib/auth-paths"
import { Settings } from "lucide-react"

export default async function SettingsPage() {
  const user = await requireAuth()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Account shortcuts for the signed-in user."
        icon={Settings}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-medium">Signed in as:</span> {user.name} ({user.email})
          </p>
          <p>
            <span className="font-medium">Role:</span> {getRoleLabel(user.role)}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/profile">View profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
