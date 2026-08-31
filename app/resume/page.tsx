import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { listResumesByUser } from "@/services/resume-service"
import { ResumeCard } from "@/components/resume/resume-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { FileText, Upload } from "lucide-react"

export default async function ResumeListPage() {
  const user = await requireAuth()
  const resumes = await listResumesByUser(user.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="My Resumes"
          description="Uploaded resumes and their extraction status."
          icon={FileText}
        />
        <Button asChild className="sm:mt-1">
          <Link href="/resume/upload">
            <Upload className="h-4 w-4" />
            Upload Resume
          </Link>
        </Button>
      </div>

      {resumes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resume uploaded yet."
          description="Upload your resume to start your AI analysis."
          actionText="Upload Resume"
          actionHref="/resume/upload"
        />
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              id={resume.id}
              fileName={resume.fileName}
              fileType={resume.fileType}
              uploadedAt={resume.createdAt}
              analysisStatus={resume.analysisStatus}
              viewHref={`/resume/${resume.id}`}
              analyzeHref={`/resume/${resume.id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
