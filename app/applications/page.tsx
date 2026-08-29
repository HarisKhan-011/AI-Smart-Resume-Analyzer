import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { ClipboardList } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <FeaturePlaceholder
        title="Applications"
        description="Track your job applications in one place."
        icon={ClipboardList}
        actionLabel="Explore Jobs"
        actionHref="/jobs"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={ClipboardList}
            title="No applications tracked"
            description="You haven't tracked any applications yet."
            actionText="Explore Jobs"
            actionHref="/jobs"
          />
        </CardContent>
      </Card>
    </div>
  )
}
