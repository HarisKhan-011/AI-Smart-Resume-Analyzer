import Link from "next/link"
import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-utils"
import { getOwnedPostedJob } from "@/services/recruiter/recruiter-job-service"
import { RecruiterJobForm } from "@/components/recruiter/recruiter-job-form"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Briefcase } from "lucide-react"

interface EditJobPageProps {
  params: Promise<{ id: string }>
}

export default async function RecruiterEditJobPage({ params }: EditJobPageProps) {
  const user = await requireRole(["recruiter", "admin"])
  const { id } = await params
  const job = await getOwnedPostedJob(id, user.id)
  if (!job) notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Edit job"
          description={`${job.title} · ${job.company}`}
          icon={Briefcase}
        />
        <Button asChild variant="outline" className="sm:mt-1">
          <Link href="/recruiter/jobs">Back to jobs</Link>
        </Button>
      </div>
      <RecruiterJobForm job={job} />
    </div>
  )
}
