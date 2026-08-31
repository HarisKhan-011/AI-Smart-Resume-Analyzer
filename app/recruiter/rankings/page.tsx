import Link from "next/link"
import { requireRole } from "@/lib/auth-utils"
import { listRecruiterJobs } from "@/services/recruiter/recruiter-job-service"
import { rankApplicantsForJob } from "@/services/recruiter/recruiter-candidate-service"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MatchScore } from "@/components/matching/match-score"
import { SkillBadge } from "@/components/matching/skill-badge"
import { BarChart3 } from "lucide-react"

interface RankingsPageProps {
  searchParams: Promise<{ jobId?: string }>
}

export default async function RecruiterRankingsPage({ searchParams }: RankingsPageProps) {
  const user = await requireRole(["recruiter", "admin"])
  const params = await searchParams
  const jobs = await listRecruiterJobs(user.id)
  const selectedId = params.jobId?.trim() || jobs[0]?.id || ""
  const ranking = selectedId ? await rankApplicantsForJob(user.id, selectedId).catch(() => null) : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Rankings"
        description="Applicants for a selected job, ranked with the Phase 8 skill matcher."
        icon={BarChart3}
      />

      {jobs.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Post a job first"
          description="Rankings need a job posting and at least one applicant."
          actionText="Create job"
          actionHref="/recruiter/jobs/new"
        />
      ) : (
        <>
          <form className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-end" method="GET">
            <div className="min-w-0 flex-1 space-y-2">
              <label htmlFor="ranking-job" className="text-sm font-medium">
                Job
              </label>
              <select
                id="ranking-job"
                name="jobId"
                defaultValue={selectedId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} · {job.company}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Rank candidates</Button>
          </form>

          {!ranking || ranking.rankings.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No applicants for this job"
              description="Share the listing so candidates can apply. Rankings use required-skill coverage from the existing matcher."
            />
          ) : (
            <ol className="space-y-4">
              {ranking.rankings.map((item) => (
                <li key={item.applicationId}>
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Rank #{item.rank}</p>
                        <CardTitle className="text-lg">{item.candidateName}</CardTitle>
                      </div>
                      <MatchScore score={item.matchScore} size="sm" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">
                        Match <span className="font-semibold">{item.matchScore}%</span>
                        {item.resumeFileName ? ` · ${item.resumeFileName}` : ""}
                      </p>
                      <div>
                        <p className="mb-2 text-sm font-medium">Matched skills</p>
                        <div className="flex flex-wrap gap-2">
                          {item.matchedSkills.length === 0 ? (
                            <p className="text-sm text-muted-foreground">None</p>
                          ) : (
                            item.matchedSkills.map((skill) => (
                              <SkillBadge key={skill} skill={skill} status="matched" size="sm" />
                            ))
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium">Missing skills</p>
                        <div className="flex flex-wrap gap-2">
                          {item.missingSkills.length === 0 ? (
                            <p className="text-sm text-muted-foreground">None</p>
                          ) : (
                            item.missingSkills.map((skill) => (
                              <SkillBadge key={skill} skill={skill} status="missing" size="sm" />
                            ))
                          )}
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/recruiter/candidates/${item.candidateId}`}>View profile</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  )
}
