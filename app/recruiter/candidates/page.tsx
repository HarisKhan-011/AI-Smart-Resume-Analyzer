import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { Users } from "lucide-react"

export default function RecruiterCandidatesPage() {
  return (
    <FeaturePlaceholder
      title="Candidates"
      description="View and manage candidate applications and resumes."
      icon={Users}
      actionLabel="View Rankings"
      actionHref="/recruiter/rankings"
    />
  )
}
