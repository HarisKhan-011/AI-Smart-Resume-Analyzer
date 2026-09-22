"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, Loader2, Sparkles } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { MatchResumeOption, MatchJobOption } from "@/components/matching/check-match-form"
import {
  INTERVIEW_CATEGORIES,
  type InterviewCategory,
  type InterviewDifficulty,
  type InterviewEvaluation,
  type InterviewPrepResult,
  type InterviewQuestion,
} from "@/types/interview-prep"

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

const categoryLabels: Record<InterviewCategory, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  hr: "HR",
}

function difficultyVariant(difficulty: InterviewDifficulty) {
  if (difficulty === "easy") return "success" as const
  if (difficulty === "hard") return "destructive" as const
  return "warning" as const
}

function scoreVariant(score: number) {
  if (score >= 75) return "success" as const
  if (score >= 50) return "warning" as const
  return "destructive" as const
}

function QuestionCard({
  question,
  answer,
  evaluation,
  error,
  isEvaluating,
  disabled,
  onAnswerChange,
  onEvaluate,
}: {
  question: InterviewQuestion
  answer: string
  evaluation: InterviewEvaluation | undefined
  error: string | undefined
  isEvaluating: boolean
  disabled: boolean
  onAnswerChange: (value: string) => void
  onEvaluate: () => void
}) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{categoryLabels[question.category]}</Badge>
          <Badge variant={difficultyVariant(question.difficulty)}>{question.difficulty}</Badge>
          {question.focus && <Badge variant="secondary">{question.focus}</Badge>}
        </div>
        <CardTitle className="text-base font-medium leading-relaxed">{question.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`answer-${question.id}`}>Your answer</Label>
          <Textarea
            id={`answer-${question.id}`}
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            placeholder="Answer using only roles, skills, and projects already on your resume."
            className="min-h-[120px]"
            maxLength={4000}
            disabled={disabled || isEvaluating}
          />
        </div>
        <Button type="button" onClick={onEvaluate} disabled={disabled || isEvaluating || !answer.trim()}>
          {isEvaluating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          {isEvaluating ? "Evaluating..." : "Evaluate answer"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unable to evaluate</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {evaluation && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={scoreVariant(evaluation.score)}>Score {evaluation.score}/100</Badge>
            </div>
            <p className="text-sm leading-relaxed">{evaluation.feedback}</p>
            <EvaluationList title="Strengths" items={evaluation.strengths} />
            <EvaluationList title="Weaknesses" items={evaluation.weaknesses} />
            <EvaluationList title="Suggestions" items={evaluation.suggestions} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EvaluationList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function InterviewPrepForm({
  resumes,
  jobs,
}: {
  resumes: MatchResumeOption[]
  jobs: MatchJobOption[]
}) {
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "")
  const [jobId, setJobId] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InterviewPrepResult | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [evaluations, setEvaluations] = useState<Record<string, InterviewEvaluation>>({})
  const [evalErrors, setEvalErrors] = useState<Record<string, string>>({})
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)

  const groupedQuestions = useMemo(() => {
    const questions = result?.questions ?? []
    return INTERVIEW_CATEGORIES.map((category) => ({
      category,
      questions: questions.filter((question) => question.category === category),
    })).filter((group) => group.questions.length > 0)
  }, [result])

  async function onGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobId: jobId || undefined }),
      })
      const body = (await response.json()) as InterviewPrepResult & { error?: string }
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to generate interview questions.")
      }
      setResult(body)
      setAnswers({})
      setEvaluations({})
      setEvalErrors({})
    } catch (generateError) {
      setResult(null)
      setAnswers({})
      setEvaluations({})
      setEvalErrors({})
      setError(generateError instanceof Error ? generateError.message : "Unable to generate interview questions.")
    } finally {
      setIsGenerating(false)
    }
  }

  async function onEvaluate(question: InterviewQuestion) {
    const answer = answers[question.id]?.trim() ?? ""
    if (!answer || !result) return

    setEvaluatingId(question.id)
    setEvalErrors((current) => {
      const next = { ...current }
      delete next[question.id]
      return next
    })

    try {
      const response = await fetch("/api/interview-prep/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: result.resume.id,
          jobId: result.job?.id,
          question,
          answer,
        }),
      })
      const body = (await response.json()) as InterviewEvaluation & { error?: string }
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to evaluate this answer.")
      }
      setEvaluations((current) => ({ ...current, [question.id]: body }))
    } catch (evaluateError) {
      setEvalErrors((current) => ({
        ...current,
        [question.id]: evaluateError instanceof Error ? evaluateError.message : "Unable to evaluate this answer.",
      }))
    } finally {
      setEvaluatingId(null)
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Choose a resume</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onGenerate} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interview-resume">Resume</Label>
              <select
                id="interview-resume"
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
              <Label htmlFor="interview-job">Target job (optional)</Label>
              <select
                id="interview-job"
                className={cn(selectClassName)}
                value={jobId}
                onChange={(event) => setJobId(event.target.value)}
                disabled={isGenerating}
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
              <Button type="submit" disabled={isGenerating || !resumeId}>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                )}
                {isGenerating
                  ? "Generating new questions..."
                  : result
                    ? "Generate new questions"
                    : "Generate interview questions"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to generate questions</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isGenerating && (
        <p className="text-sm text-muted-foreground">
          Building a new set of technical, behavioral, and HR questions from your resume text...
        </p>
      )}

      {result && !isGenerating && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{result.resume.fileName}</Badge>
            {result.job && (
              <Badge variant="outline">
                {result.job.title} · {result.job.company}
              </Badge>
            )}
            <Badge variant={result.usedLlm ? "success" : "secondary"}>
              {result.usedLlm ? "AI wording" : "Resume-grounded questions"}
            </Badge>
          </div>
          {result.notes[0] && (
            <Alert>
              <AlertTitle>Grounded in your resume</AlertTitle>
              <AlertDescription>{result.notes.join(" ")}</AlertDescription>
            </Alert>
          )}

          {groupedQuestions.map((group) => (
            <section key={group.category} className="space-y-3">
              <h2 className="text-lg font-semibold">{categoryLabels[group.category]} questions</h2>
              {group.questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  answer={answers[question.id] ?? ""}
                  evaluation={evaluations[question.id]}
                  error={evalErrors[question.id]}
                  isEvaluating={evaluatingId === question.id}
                  disabled={isGenerating || Boolean(evaluatingId && evaluatingId !== question.id)}
                  onAnswerChange={(value) =>
                    setAnswers((current) => ({ ...current, [question.id]: value }))
                  }
                  onEvaluate={() => void onEvaluate(question)}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
