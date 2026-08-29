import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { Briefcase } from "lucide-react"

interface JobDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params

  return (
    <FeaturePlaceholder
      title={`Job Details (${id})`}
      description="Job detail pages will display full job information in a future phase."
      icon={Briefcase}
      actionLabel="Back to Jobs"
      actionHref="/jobs"
    />
  )
}
