import { requireAuth } from "@/lib/auth-utils"
import { listResumesByUser } from "@/services/resume-service"
import { getAccessibleJob, listAccessibleJobs } from "@/services/job-service"
import { JobMatchWorkspace } from "@/components/matching/job-match-workspace"
import { PageHeader } from "@/components/shared/page-header"
import { Search } from "lucide-react"

interface JobMatchPageProps {
  searchParams: Promise<{ jobId?: string }>
}

export default async function JobMatchPage({ searchParams }: JobMatchPageProps) {
  const user = await requireAuth()
  const params = await searchParams
  const [resumes, jobs] = await Promise.all([
    listResumesByUser(user.id),
    listAccessibleJobs(user.id),
  ])

  const selectedJobId = params.jobId?.trim()
  if (selectedJobId && !jobs.some((job) => job.id === selectedJobId)) {
    const extra = await getAccessibleJob(selectedJobId, user.id)
    if (extra) jobs.unshift(extra)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Match"
        description="Compare an analyzed resume with a job description using skill match and semantic similarity."
        icon={Search}
      />
      <JobMatchWorkspace
        initialJobId={selectedJobId}
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
