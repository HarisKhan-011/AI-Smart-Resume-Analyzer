"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, ArrowRight, BookOpen, Loader2, Route } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MatchScore } from "@/components/matching/match-score"
import { SkillBadge } from "@/components/matching/skill-badge"
import { cn } from "@/lib/utils"
import type { MatchResumeOption, MatchJobOption } from "@/components/matching/check-match-form"
import type { CareerRoadmapResult, RoadmapPriority, RoadmapStageLevel } from "@/types/career-roadmap"

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

const stageCopy: Record<RoadmapStageLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
}

function priorityVariant(priority: RoadmapPriority) {
  if (priority === "high") return "destructive" as const
  if (priority === "medium") return "warning" as const
  return "secondary" as const
}

export function CareerRoadmapForm({
  resumes,
  jobs,
}: {
  resumes: MatchResumeOption[]
  jobs: MatchJobOption[]
}) {
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "")
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CareerRoadmapResult | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/career-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobId }),
      })
      const body = (await response.json()) as CareerRoadmapResult & { error?: string }
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to generate a career roadmap.")
      }
      setResult(body)
    } catch (generateError) {
      setResult(null)
      setError(generateError instanceof Error ? generateError.message : "Unable to generate a career roadmap.")
    } finally {
      setIsGenerating(false)
    }
  }

  if (resumes.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
          <p>
            Upload a resume first.{" "}
            <Link href="/resume/upload" className="font-medium text-primary underline-offset-4 hover:underline">
              Upload resume
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
          <p>
            Analyze a job description in{" "}
            <Link href="/job-match" className="font-medium text-primary underline-offset-4 hover:underline">
              Job Match
            </Link>{" "}
            first so the roadmap has a real target role.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Choose a resume and target role</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="roadmap-resume">Resume</Label>
              <select
                id="roadmap-resume"
                className={cn(selectClassName)}
                value={resumeId}
                onChange={(event) => setResumeId(event.target.value)}
                disabled={isGenerating}
              >
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.fileName} ({resume.skillCount} skills)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roadmap-job">Target job</Label>
              <select
                id="roadmap-job"
                className={cn(selectClassName)}
                value={jobId}
                onChange={(event) => setJobId(event.target.value)}
                disabled={isGenerating}
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} · {job.company}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={isGenerating || !resumeId || !jobId}>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Route className="h-4 w-4" aria-hidden="true" />
                )}
                {isGenerating ? "Building roadmap..." : "Generate career roadmap"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to generate roadmap</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isGenerating && (
        <p className="text-sm text-muted-foreground">
          Comparing your resume skills, ATS notes, and the selected job without inventing experience...
        </p>
      )}

      {result && !isGenerating && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{result.resume.fileName}</Badge>
            <Badge variant="outline">
              {result.target.title} · {result.target.company}
            </Badge>
            {result.matchScore != null && <Badge variant="secondary">Saved match {result.matchScore}%</Badge>}
            {result.resume.atsScore != null && result.resume.atsAnalysisStatus === "completed" && (
              <Badge variant="secondary">ATS {result.resume.atsScore}</Badge>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
            <MatchScore score={result.coveragePercent} label="Coverage" />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Path to the target role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <PathNode title="Current skills" count={result.currentSkills.length} />
                  <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />
                  <PathNode title="Missing skills" count={result.missingSkills.length + result.preferredMissingSkills.length} />
                  <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />
                  <PathNode title="Learning steps" count={result.stages.reduce((sum, stage) => sum + stage.steps.length, 0)} />
                  <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />
                  <PathNode title="Target role" count={1} detail={result.target.title} />
                </div>
              </CardContent>
            </Card>
          </div>

          {result.notes[0] && (
            <Alert>
              <AlertTitle>Grounded in your data</AlertTitle>
              <AlertDescription>{result.notes.join(" ")}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.experience.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Experience on this resume: {result.experience.join("; ")}.
                  </p>
                )}
                {result.currentSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    None of the listed job skills are on this resume yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {result.currentSkills.map((skill) => (
                      <SkillBadge key={skill} skill={skill} status="matched" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Missing skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.missingSkills.length === 0 && result.preferredMissingSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    This resume already covers the listed required and preferred skills.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {result.missingSkills.map((skill) => (
                      <SkillBadge key={skill} skill={skill} status="missing" />
                    ))}
                    {result.preferredMissingSkills.map((skill) => (
                      <SkillBadge key={skill} skill={skill} status="preferred" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {result.stages.map((stage) => (
              <Card key={stage.level}>
                <CardHeader>
                  <CardTitle className="text-lg">{stageCopy[stage.level]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{stage.description}</p>
                  {stage.steps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No skills in this stage for the selected job.</p>
                  ) : (
                    <ul className="space-y-3">
                      {stage.steps.map((step) => (
                        <li key={step.skill} className="rounded-lg border p-3">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="font-medium">{step.skill}</span>
                            <Badge variant={priorityVariant(step.priority)}>{step.priority} priority</Badge>
                            <Badge variant={step.required ? "destructive" : "warning"}>
                              {step.required ? "Required" : "Preferred"}
                            </Badge>
                          </div>
                          <p className="flex items-start gap-2 text-sm text-muted-foreground">
                            <BookOpen className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            {step.topic}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PathNode({ title, count, detail }: { title: string; count: number; detail?: string }) {
  return (
    <div className="min-w-[8rem] rounded-lg border bg-muted/40 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="text-sm font-medium">{detail ?? count}</p>
    </div>
  )
}
