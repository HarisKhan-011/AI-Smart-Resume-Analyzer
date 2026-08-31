import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth-utils"
import { getAccessibleJob } from "@/services/job-service"
import { loadSkillDictionary, getSkillByName } from "@/services/nlp/skill-dictionary"
import { formatEmploymentType, jobSourceLabel } from "@/services/jobs/normalize-job"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SkillBadge } from "@/components/matching/skill-badge"
import { formatDate } from "@/lib/utils"
import { Briefcase, ExternalLink, Search } from "lucide-react"

interface JobDetailPageProps {
  params: Promise<{ id: string }>
}

function SkillList({ skills, empty }: { skills: string[]; empty: string }) {
  if (skills.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <SkillBadge key={skill} skill={skill} />
      ))}
    </div>
  )
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const user = await requireAuth()
  const { id } = await params
  const job = await getAccessibleJob(id, user.id)

  if (!job) {
    notFound()
  }

  const dictionary = loadSkillDictionary()
  const detected = [...job.requiredSkills, ...job.preferredSkills]
    .filter((name, index, all) => all.indexOf(name) === index)
    .map((name) => {
      const definition = getSkillByName(name, dictionary)
      return {
        name,
        category: definition?.category ?? "Tools",
      }
    })

  const grouped = new Map<string, string[]>()
  for (const skill of detected) {
    const current = grouped.get(skill.category) ?? []
    current.push(skill.name)
    grouped.set(skill.category, current)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={job.title}
          description={`${job.company}${job.location ? ` · ${job.location}` : ""}`}
          icon={Briefcase}
        />
        <div className="flex flex-wrap gap-2 sm:mt-1">
          <Button asChild>
            <Link href={`/job-match?jobId=${job.id}`}>
              <Search className="h-4 w-4" />
              Check Resume Match
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/jobs">Back to jobs</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{formatEmploymentType(job.employmentType)}</Badge>
        <Badge variant="secondary">{jobSourceLabel(job.source, job.sourceUrl)}</Badge>
        <Badge variant="outline">{job.requiredSkills.length} required skills</Badge>
        <Badge variant="secondary">{job.preferredSkills.length} preferred</Badge>
        <span className="text-sm text-muted-foreground">
          Posted {formatDate(job.postedDate)}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><span className="font-medium">Title:</span> {job.title}</p>
          <p><span className="font-medium">Company:</span> {job.company}</p>
          <p><span className="font-medium">Location:</span> {job.location}</p>
          <p><span className="font-medium">Job type:</span> {formatEmploymentType(job.employmentType)}</p>
          <p><span className="font-medium">Source:</span> {jobSourceLabel(job.source, job.sourceUrl)}</p>
          {job.sourceUrl && (
            <p>
              <span className="font-medium">Original listing:</span>{" "}
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
              >
                View original job
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Required Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillList skills={job.requiredSkills} empty="No required skills were detected." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferred Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillList skills={job.preferredSkills} empty="No preferred skills were detected." />
        </CardContent>
      </Card>

      {detected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detected Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {Array.from(grouped.entries()).map(([category, skills]) => (
                <div key={category}>
                  <h3 className="mb-2 text-sm font-semibold">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <SkillBadge key={skill} skill={skill} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job description</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm leading-relaxed">
            {job.description}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
