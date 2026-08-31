import Link from "next/link"
import { requireRole } from "@/lib/auth-utils"
import { listRecruiterApplicants } from "@/services/recruiter/recruiter-candidate-service"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge"
import { Users } from "lucide-react"

export default async function RecruiterCandidatesPage() {
  const user = await requireRole(["recruiter", "admin"])
  const applicants = await listRecruiterApplicants(user.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description="People who have applied to your job postings."
        icon={Users}
      />

      {applicants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applicants yet"
          description="When candidates apply to your active jobs, they will show up here with match scores."
          actionText="Manage jobs"
          actionHref="/recruiter/jobs"
        />
      ) : (
        <div className="space-y-4">
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Candidate</th>
                  <th className="px-4 py-3 font-medium">Resume</th>
                  <th className="px-4 py-3 font-medium">Job applied for</th>
                  <th className="px-4 py-3 font-medium">Match</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Profile</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((item) => (
                  <tr key={item.applicationId} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{item.candidateName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.resumeFileName ?? "No resume"}
                    </td>
                    <td className="px-4 py-3">{item.jobTitle}</td>
                    <td className="px-4 py-3">{item.matchScore}%</td>
                    <td className="px-4 py-3">
                      <ApplicationStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/recruiter/candidates/${item.candidateId}`}>View profile</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:hidden">
            {applicants.map((item) => (
              <Card key={item.applicationId}>
                <CardContent className="space-y-3 p-4">
                  <p className="font-semibold">{item.candidateName}</p>
                  <p className="text-sm text-muted-foreground">{item.jobTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    Resume: {item.resumeFileName ?? "No resume"} · Match {item.matchScore}%
                  </p>
                  <ApplicationStatusBadge status={item.status} />
                  <Button asChild size="sm">
                    <Link href={`/recruiter/candidates/${item.candidateId}`}>View profile</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
