import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { listResumesByUser } from "@/services/resume-service"
import { listAccessibleJobs } from "@/services/job-service"
import { ResumeImproveForm } from "@/components/resume/resume-improve-form"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Wand2 } from "lucide-react"

export default async function ResumeImprovePage() {
  const user = await requireAuth()
  const [resumes, jobs] = await Promise.all([
    listResumesByUser(user.id),
    listAccessibleJobs(user.id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Resume Improvement"
          description="Get truthful rewrites of your Summary, Experience, Projects, and Skills. Your original resume is never overwritten."
          icon={Wand2}
        />
        <Button asChild variant="outline" className="sm:mt-1">
          <Link href="/resume">My Resumes</Link>
        </Button>
      </div>
      <ResumeImproveForm
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
