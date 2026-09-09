"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, Check, Copy, Loader2, Sparkles } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { MatchResumeOption, MatchJobOption } from "@/components/matching/check-match-form"
import type { ResumeImproveResult, ResumeImproveSection } from "@/types/resume-improve"

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

function CopyButton({ text, disabled }: { text: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!text || disabled) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void copy()} disabled={!text || disabled}>
      {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      {copied ? "Copied" : "Copy improved"}
    </Button>
  )
}

function SectionCompare({ section }: { section: ResumeImproveSection }) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg">{section.label}</CardTitle>
        <CopyButton text={section.improved} />
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original</p>
          <pre className="min-h-[7rem] whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-3 text-sm leading-relaxed">
            {section.original || "No original text was found for this section."}
          </pre>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Improved</p>
          <pre className="min-h-[7rem] whitespace-pre-wrap break-words rounded-lg border bg-background p-3 text-sm leading-relaxed">
            {section.improved || "No rewrite is available without inventing content."}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

export function ResumeImproveForm({
  resumes,
  jobs,
}: {
  resumes: MatchResumeOption[]
  jobs: MatchJobOption[]
}) {
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "")
  const [jobId, setJobId] = useState("")
  const [isImproving, setIsImproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResumeImproveResult | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsImproving(true)
    setError(null)

    try {
      const response = await fetch("/api/resume-improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobId: jobId || undefined }),
      })
      const body = (await response.json()) as ResumeImproveResult & { error?: string }
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to improve this resume.")
      }
      setResult(body)
    } catch (improveError) {
      setResult(null)
      setError(improveError instanceof Error ? improveError.message : "Unable to improve this resume.")
    } finally {
      setIsImproving(false)
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

  const allImproved = result?.sections.map((section) => section.improved).filter(Boolean).join("\n\n") ?? ""

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Choose a resume</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="improve-resume">Resume</Label>
              <select
                id="improve-resume"
                className={cn(selectClassName)}
                value={resumeId}
                onChange={(event) => setResumeId(event.target.value)}
                disabled={isImproving}
              >
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.fileName} ({resume.skillCount} skills)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="improve-job">Target job (optional)</Label>
              <select
                id="improve-job"
                className={cn(selectClassName)}
                value={jobId}
                onChange={(event) => setJobId(event.target.value)}
                disabled={isImproving}
              >
                <option value="">No target job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} · {job.company}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={isImproving || !resumeId}>
                {isImproving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                )}
                {isImproving ? "Improving..." : "Suggest improvements"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to improve resume</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isImproving && (
        <p className="text-sm text-muted-foreground">Generating truthful rewrites from your extracted resume text...</p>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{result.resume.fileName}</Badge>
            {result.resume.atsScore != null && <Badge variant="secondary">ATS {result.resume.atsScore}/100</Badge>}
            {result.job && <Badge variant="outline">{result.job.title}</Badge>}
            <Badge variant={result.usedLlm ? "success" : "secondary"}>
              {result.usedLlm ? "AI rewrite" : "Rule-based rewrite"}
            </Badge>
            <CopyButton text={allImproved} />
          </div>
          <Alert>
            <AlertTitle>Original resume is unchanged</AlertTitle>
            <AlertDescription>
              {result.notes[0] ?? "Copy the improved text if you want to use it. Nothing was saved over your upload."}
            </AlertDescription>
          </Alert>
          {result.notes.slice(1).length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {result.notes.slice(1).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
          {result.sections.map((section) => (
            <SectionCompare key={section.key} section={section} />
          ))}
        </div>
      )}
    </div>
  )
}
