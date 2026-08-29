import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { Briefcase } from "lucide-react"

export default function RecruiterJobsPage() {
  return (
    <FeaturePlaceholder
      title="My Jobs"
      description="Create and manage job postings for your organization."
      icon={Briefcase}
      actionLabel="Recruiter Dashboard"
      actionHref="/recruiter"
    />
  )
}
