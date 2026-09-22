"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, BookOpen, Loader2, TrendingUp } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { MatchScore } from "@/components/matching/match-score"
import { SkillBadge } from "@/components/matching/skill-badge"
import { cn } from "@/lib/utils"
import type { MatchResumeOption, MatchJobOption } from "@/components/matching/check-match-form"
import type { LearningRecommendation } from "@/services/skill-gap/skill-gap-service"

type SkillGapResponse = {
  error?: string
  coveragePercent?: number
  matchedSkills?: string[]
  missingSkills?: string[]
  preferredMatchedSkills?: string[]
  preferredMissingSkills?: string[]
  recommendations?: LearningRecommendation[]
  resume?: { id: string; fileName: string }
  job?: {
    id: string
    title: string
    company: string
    location: string
  }
}

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

function SkillGroup({
  title,
  skills,
  status,
  empty,
}: {
  title: string
  skills: string[]
  status: "matched" | "missing" | "preferred"
  empty: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <SkillBadge key={skill} skill={skill} status={status} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SkillGapForm({
  resumes,
  jobs,
}: {
  resumes: MatchResumeOption[]
  jobs: MatchJobOption[]
}) {
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "")
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SkillGapResponse | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/skill-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobId }),
      })
      const body = (await response.json()) as SkillGapResponse
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to analyze skill gap.")
      }
      setResult(body)
    } catch (gapError) {
      setResult(null)
      setError(gapError instanceof Error ? gapError.message : "Unable to analyze skill gap.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (resumes.length === 0 || jobs.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
          {resumes.length === 0 && (
            <p>
              Upload and analyze a resume first.{" "}
              <Link href="/resume/upload" className="font-medium text-primary underline-offset-4 hover:underline">
                Upload resume
              </Link>
            </p>
          )}
          {jobs.length === 0 && (
            <p>
              Analyze a job description first.{" "}
              <Link href="/job-match" className="font-medium text-primary underline-offset-4 hover:underline">
                Analyze job
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  const coverage = result?.coveragePercent ?? 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compare resume and job</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gap-resume">Resume</Label>
                <select
                  id="gap-resume"
                  className={cn(selectClassName)}
                  value={resumeId}
                  onChange={(event) => setResumeId(event.target.value)}
                  disabled={isAnalyzing}
                  required
                >
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.fileName} ({resume.skillCount} skills)
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gap-job">Job</Label>
                <select
                  id="gap-job"
                  className={cn(selectClassName)}
                  value={jobId}
                  onChange={(event) => setJobId(event.target.value)}
                  disabled={isAnalyzing}
                  required
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} · {job.company}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" disabled={isAnalyzing || !resumeId || !jobId}>
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
              )}
              {isAnalyzing ? "Analyzing..." : "Analyze Skill Gap"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Skill gap analysis failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
            <MatchScore score={coverage} size="lg" />
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Skill Coverage</CardTitle>
                <Badge variant="outline">{coverage}%</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={coverage} aria-label="Skill coverage" />
                <div className="space-y-1 text-sm">
                  {result.job && (
                    <>
                      <p><span className="font-medium">Job:</span> {result.job.title}</p>
                      <p><span className="font-medium">Company:</span> {result.job.company}</p>
                    </>
                  )}
                  {result.resume && (
                    <p><span className="font-medium">Resume:</span> {result.resume.fileName}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <SkillGroup
            title="Matched Skills"
            skills={result.matchedSkills ?? []}
            status="matched"
            empty="No required skills were matched."
          />
          <SkillGroup
            title="Missing Skills"
            skills={result.missingSkills ?? []}
            status="missing"
            empty="No required skills are missing."
          />
          <SkillGroup
            title="Preferred Skills"
            skills={result.preferredMissingSkills ?? []}
            status="preferred"
            empty="No preferred skills are missing."
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommended Learning</CardTitle>
            </CardHeader>
            <CardContent>
              {!result.recommendations?.length ? (
                <p className="text-sm text-muted-foreground">
                  No learning gaps for the required or preferred skills.
                </p>
              ) : (
                <ul className="space-y-3">
                  {result.recommendations.map((item) => (
                    <li key={`${item.required ? "required" : "preferred"}-${item.skill}`} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-medium">{item.skill}</p>
                        <p className="text-sm text-muted-foreground">{item.suggestion}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.required ? "Required skill" : "Preferred skill"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
