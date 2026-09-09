import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { listResumesByUser } from "@/services/resume-service"
import { listAccessibleJobs } from "@/services/job-service"
import { InterviewPrepForm } from "@/components/interview/interview-prep-form"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { GraduationCap } from "lucide-react"

export default async function InterviewPrepPage() {
  const user = await requireAuth()
  const [resumes, jobs] = await Promise.all([
    listResumesByUser(user.id),
    listAccessibleJobs(user.id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Interview Prep"
          description="Practice technical, behavioral, and HR questions grounded in your resume — and optionally a target job. Answers are scored without inventing skills or experience."
          icon={GraduationCap}
        />
        <Button asChild variant="outline" className="sm:mt-1">
          <Link href="/resume">My Resumes</Link>
        </Button>
      </div>
      <InterviewPrepForm
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
