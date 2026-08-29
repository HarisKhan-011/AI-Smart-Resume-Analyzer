import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { Briefcase } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { JobCard } from "@/components/jobs/job-card"
import { mockDemoJobs } from "@/lib/mock-data"

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <FeaturePlaceholder
        title="Jobs"
        description="Browse available job listings. Job data will be connected in a future phase."
        icon={Briefcase}
        actionLabel="Check Job Match"
        actionHref="/job-match"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Demo Job Cards (UI Preview)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            The cards below use clearly labeled demo data for UI development only.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockDemoJobs.map((job) => (
              <JobCard
                key={job.id}
                id={job.id}
                title={job.title}
                company={job.company}
                location={job.location}
                skills={job.skills}
                postedAt={job.postedAt}
                employmentType="Full-time"
                matchScore={null}
                href={`/jobs/${job.id}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Saved Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Briefcase}
            title="No saved jobs"
            description="Save jobs you're interested in to review them later."
            actionText="Explore Jobs"
            actionHref="/jobs"
          />
        </CardContent>
      </Card>
    </div>
  )
}
