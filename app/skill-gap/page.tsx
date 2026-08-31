import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { listResumesByUser } from "@/services/resume-service"
import { listAccessibleJobs } from "@/services/job-service"
import { SkillGapForm } from "@/components/skill-gap/skill-gap-form"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { TrendingUp } from "lucide-react"

export default async function SkillGapPage() {
  const user = await requireAuth()
  const [resumes, jobs] = await Promise.all([
    listResumesByUser(user.id),
    listAccessibleJobs(user.id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Skill Gap Analysis"
          description="See which required and preferred skills are missing from your resume."
          icon={TrendingUp}
        />
        <Button asChild variant="outline" className="sm:mt-1">
          <Link href="/job-match">Check Match</Link>
        </Button>
      </div>
      <SkillGapForm
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
