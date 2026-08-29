import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { Lightbulb } from "lucide-react"

export default function RecommendationsPage() {
  return (
    <FeaturePlaceholder
      title="Recommended Jobs"
      description="AI-powered job recommendations will be connected in a future phase."
      icon={Lightbulb}
      actionLabel="Upload Resume"
      actionHref="/resume/upload"
    />
  )
}
