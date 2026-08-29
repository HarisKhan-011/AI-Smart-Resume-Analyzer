import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { Search } from "lucide-react"

export default function JobMatchPage() {
  return (
    <FeaturePlaceholder
      title="Job Matching"
      description="Job matching functionality will be connected in the matching phase."
      icon={Search}
      actionLabel="Browse Jobs"
      actionHref="/jobs"
    />
  )
}
