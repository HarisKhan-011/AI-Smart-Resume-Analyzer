import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { FileSearch } from "lucide-react"

export default function ResumeAnalysisPage() {
  return (
    <FeaturePlaceholder
      title="Resume Analysis"
      description="View detailed AI analysis of your uploaded resume."
      icon={FileSearch}
      actionLabel="Upload Resume"
      actionHref="/resume/upload"
    />
  )
}
