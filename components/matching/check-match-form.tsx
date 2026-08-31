"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, Loader2, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MatchScore } from "@/components/matching/match-score"
import { SkillBadge } from "@/components/matching/skill-badge"
import { cn } from "@/lib/utils"

export type MatchResumeOption = {
  id: string
  fileName: string
  skillCount: number
}

export type MatchJobOption = {
  id: string
  title: string
  company: string
  location: string
  requiredSkillCount: number
}

type MatchResponse = {
  error?: string
  overallScore?: number
  skillScore?: number
  matchedSkills?: string[]
  missingSkills?: string[]
  preferredMatchedSkills?: string[]
  preferredMissingSkills?: string[]
  resume?: { id: string; fileName: string }
  job?: {
    id: string
    title: string
    company: string
    location: string
    requiredSkills?: string[]
    preferredSkills?: string[]
  }
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

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

export function CheckMatchForm({
  resumes,
  jobs,
  initialJobId,
}: {
  resumes: MatchResumeOption[]
  jobs: MatchJobOption[]
  initialJobId?: string
}) {
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "")
  const [jobId, setJobId] = useState(
    jobs.some((job) => job.id === initialJobId) ? initialJobId ?? "" : jobs[0]?.id ?? ""
  )
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MatchResponse | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsChecking(true)
    setError(null)

    try {
      const response = await fetch("/api/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobId }),
      })
      const body = (await response.json()) as MatchResponse
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to check match.")
      }
      setResult(body)
    } catch (matchError) {
      setResult(null)
      setError(matchError instanceof Error ? matchError.message : "Unable to check match.")
    } finally {
      setIsChecking(false)
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
              Analyze a job description or{" "}
              <Link href="/jobs" className="font-medium text-primary underline-offset-4 hover:underline">
                search online jobs
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

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
                <Label htmlFor="match-resume">Resume</Label>
                <select
                  id="match-resume"
                  className={cn(selectClassName)}
                  value={resumeId}
                  onChange={(event) => setResumeId(event.target.value)}
                  disabled={isChecking}
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
                <Label htmlFor="match-job">Job</Label>
                <select
                  id="match-job"
                  className={cn(selectClassName)}
                  value={jobId}
                  onChange={(event) => setJobId(event.target.value)}
                  disabled={isChecking}
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
            <Button type="submit" disabled={isChecking || !resumeId || !jobId}>
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              {isChecking ? "Checking..." : "Check Match"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Match failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result?.job && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
            <MatchScore score={result.overallScore ?? 0} size="lg" />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="font-medium">Title:</span> {result.job.title}</p>
                <p><span className="font-medium">Company:</span> {result.job.company}</p>
                <p><span className="font-medium">Location:</span> {result.job.location}</p>
                <p><span className="font-medium">Skill match:</span> {result.skillScore ?? 0}%</p>
                {result.resume && (
                  <p><span className="font-medium">Resume:</span> {result.resume.fileName}</p>
                )}
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
            skills={result.preferredMatchedSkills ?? []}
            status="preferred"
            empty="No preferred skills were matched."
          />
          {(result.preferredMissingSkills?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preferred skills not on resume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.preferredMissingSkills?.map((skill) => (
                    <SkillBadge key={skill} skill={skill} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
