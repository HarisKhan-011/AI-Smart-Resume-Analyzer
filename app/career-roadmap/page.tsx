import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { listResumesByUser } from "@/services/resume-service"
import { listAccessibleJobs } from "@/services/job-service"
import { CareerRoadmapForm } from "@/components/career/career-roadmap-form"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Route } from "lucide-react"

export default async function CareerRoadmapPage() {
  const user = await requireAuth()
  const [resumes, jobs] = await Promise.all([
    listResumesByUser(user.id),
    listAccessibleJobs(user.id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Career Roadmap"
          description="Build a learning path from your current resume skills to a selected job. Missing skills come only from that comparison."
          icon={Route}
        />
        <Button asChild variant="outline" className="sm:mt-1">
          <Link href="/skill-gap">Skill Gap</Link>
        </Button>
      </div>
      <CareerRoadmapForm
        resumes={resumes.map((resume) => ({
          id: resume.id,
          fileName: resume.fileName,
          skillCount: resume.skills.length,
        }))}
        jobs={jobs.map((job) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          requiredSkillCount: job.requiredSkills.length,
        }))}
      />
    </div>
  )
}
