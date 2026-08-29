import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { TrendingUp } from "lucide-react"

export default function SkillGapPage() {
  return (
    <FeaturePlaceholder
      title="Skill Gap Analysis"
      description="Skill gap analysis will be connected in the matching phase."
      icon={TrendingUp}
      actionLabel="Check Job Match"
      actionHref="/job-match"
    />
  )
}
