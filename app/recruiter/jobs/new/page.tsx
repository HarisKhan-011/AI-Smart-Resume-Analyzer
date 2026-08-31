import Link from "next/link"
import { requireRole } from "@/lib/auth-utils"
import { RecruiterJobForm } from "@/components/recruiter/recruiter-job-form"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Briefcase } from "lucide-react"

export default async function RecruiterNewJobPage() {
  await requireRole(["recruiter", "admin"])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Create job"
          description="Post a role with required and preferred skills from the skill dictionary."
          icon={Briefcase}
        />
        <Button asChild variant="outline" className="sm:mt-1">
          <Link href="/recruiter/jobs">Back to jobs</Link>
        </Button>
      </div>
      <RecruiterJobForm />
    </div>
  )
}
