import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { BarChart3 } from "lucide-react"
import { MatchScore } from "@/components/matching/match-score"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RecruiterRankingsPage() {
  return (
    <div className="space-y-6">
      <FeaturePlaceholder
        title="Candidate Rankings"
        description="Rank candidates by job fit. Rankings will be connected in a future phase."
        icon={BarChart3}
        actionLabel="View Candidates"
        actionHref="/recruiter/candidates"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match Score Component Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <MatchScore score={0} size="lg" />
        </CardContent>
      </Card>
    </div>
  )
}
