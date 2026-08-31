import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { JobAnalyzeForm } from "@/components/jobs/job-analyze-form"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function JobMatchPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Analyze Job Description"
          description="Extract required and preferred skills from a job description. Resume matching comes in a later phase."
          icon={Search}
        />
        <Button asChild variant="outline" className="sm:mt-1">
          <Link href="/jobs">View analyzed jobs</Link>
        </Button>
      </div>
      <JobAnalyzeForm />
    </div>
  )
}
