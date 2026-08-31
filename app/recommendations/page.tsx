import { requireAuth } from "@/lib/auth-utils"
import { listResumesByUser } from "@/services/resume-service"
import { RecommendationsPanel } from "@/components/recommendations/recommendations-panel"
import { PageHeader } from "@/components/shared/page-header"
import { Lightbulb } from "lucide-react"

interface RecommendationsPageProps {
  searchParams: Promise<{ resumeId?: string }>
}

export default async function RecommendationsPage({ searchParams }: RecommendationsPageProps) {
  const user = await requireAuth()
  const params = await searchParams
  const resumes = await listResumesByUser(user.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recommended Jobs"
        description="Jobs ranked for your selected resume using required skills, preferred skills, experience, and role relevance."
        icon={Lightbulb}
      />
      <RecommendationsPanel
        initialResumeId={params.resumeId?.trim()}
        resumes={resumes.map((resume) => ({
          id: resume.id,
          fileName: resume.fileName,
          skillCount: resume.skills.length,
          analysisStatus: resume.analysisStatus,
        }))}
      />
    </div>
  )
}
