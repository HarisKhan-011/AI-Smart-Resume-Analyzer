import Link from "next/link"
import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-utils"
import { getRecruiterCandidateDetail } from "@/services/recruiter/recruiter-candidate-service"
import { RecruiterError } from "@/services/recruiter/recruiter-job-service"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge"
import { SkillBadge } from "@/components/matching/skill-badge"
import { MatchScore } from "@/components/matching/match-score"
import { Users } from "lucide-react"

interface CandidateDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RecruiterCandidateDetailPage({ params }: CandidateDetailPageProps) {
  const user = await requireRole(["recruiter", "admin"])
  const { id } = await params

  let candidate
  try {
    candidate = await getRecruiterCandidateDetail(user.id, id)
  } catch (error) {
    if (error instanceof RecruiterError && error.status === 404) notFound()
    throw error
  }

  const best = candidate.applications[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={candidate.name}
          description="Applicant profile for your job postings. Password and unrelated applications are hidden."
          icon={Users}
        />
        <Button asChild variant="outline" className="sm:mt-1">
          <Link href="/recruiter/candidates">Back to candidates</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        {best && <MatchScore score={best.matchScore} size="sm" />}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Candidate information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="font-medium">Name:</span> {candidate.name}</p>
            <p><span className="font-medium">Email:</span> {candidate.email}</p>
            <p><span className="font-medium">Resume:</span> {candidate.resumeFileName ?? "No resume uploaded"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resume summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{candidate.resumeSummary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resume skills</CardTitle>
        </CardHeader>
        <CardContent>
          {candidate.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No extracted skills yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {candidate.applications.map((application) => (
        <Card key={application.applicationId}>
          <CardHeader>
            <CardTitle className="text-lg">
              {application.jobTitle} · {application.matchScore}% match
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ApplicationStatusBadge status={application.status} />
            <div>
              <p className="mb-2 text-sm font-medium">Matched skills</p>
              <div className="flex flex-wrap gap-2">
                {application.matchedSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None</p>
                ) : (
                  application.matchedSkills.map((skill) => (
                    <SkillBadge key={skill} skill={skill} status="matched" />
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Missing skills</p>
              <div className="flex flex-wrap gap-2">
                {application.missingSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None</p>
                ) : (
                  application.missingSkills.map((skill) => (
                    <SkillBadge key={skill} skill={skill} status="missing" />
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
