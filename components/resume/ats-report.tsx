import { AlertCircle, CheckCircle2, Lightbulb, ShieldAlert } from "lucide-react"
import { MatchScore } from "@/components/matching/match-score"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { atsOverallStatus, atsScoreBand } from "@/services/ats/ats-analyzer"
import type { AtsAnalysisStatus, AtsBreakdown } from "@/types/resume"

const CATEGORY_LABELS: Record<keyof AtsBreakdown, string> = {
  contact: "Contact information",
  sections: "Section structure",
  keywords: "Keyword / skill coverage",
  readability: "Readability / parsing",
  experience: "Experience quality",
  completeness: "Resume completeness",
}

const STATUS_COPY = {
  strong: { label: "Strong", description: "Parser-friendly with solid coverage", variant: "success" as const },
  good: { label: "Good", description: "Mostly ATS-readable, with room to improve", variant: "warning" as const },
  "needs-work": {
    label: "Needs work",
    description: "Several ATS-oriented issues should be fixed",
    variant: "warning" as const,
  },
  poor: { label: "Poor", description: "Likely to parse or rank weakly in ATS tools", variant: "destructive" as const },
}

function bandClasses(score: number) {
  const band = atsScoreBand(score)
  if (band === "good") {
    return {
      bar: "bg-green-500",
      text: "text-green-600 dark:text-green-400",
      badge: "success" as const,
    }
  }
  if (band === "warning") {
    return {
      bar: "bg-yellow-500",
      text: "text-yellow-600 dark:text-yellow-400",
      badge: "warning" as const,
    }
  }
  return {
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    badge: "destructive" as const,
  }
}

export type AtsReportProps = {
  atsScore?: number | null
  atsBreakdown?: AtsBreakdown | null
  atsIssues?: string[]
  atsSuggestions?: string[]
  atsStrengths?: string[]
  atsAnalysisStatus?: AtsAnalysisStatus
}

export function AtsReport({
  atsScore,
  atsBreakdown,
  atsIssues = [],
  atsSuggestions = [],
  atsStrengths = [],
  atsAnalysisStatus = "pending",
}: AtsReportProps) {
  if (atsAnalysisStatus === "failed") {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>ATS analysis could not be completed</AlertTitle>
        <AlertDescription>
          Skill extraction still ran. Re-analyze this resume to retry the ATS-oriented checker.
        </AlertDescription>
      </Alert>
    )
  }

  if (atsAnalysisStatus !== "completed" || atsScore == null || !atsBreakdown) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ATS resume check</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            An ATS-oriented score will appear here after text extraction and skill analysis finish.
          </p>
        </CardContent>
      </Card>
    )
  }

  const overall = atsOverallStatus(atsScore)
  const status = STATUS_COPY[overall]
  const overallBand = bandClasses(atsScore)
  const categories = Object.entries(atsBreakdown) as Array<[keyof AtsBreakdown, number]>

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">ATS resume check</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Rule-based parser, readability, and optimization analysis. This does not perfectly
              simulate every commercial applicant tracking system.
            </p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-2">
            <MatchScore score={atsScore} size="md" label="ATS" />
            <p className={cn("text-sm font-medium", overallBand.text)}>
              {atsScore} / 100
            </p>
            <p className="text-center text-sm text-muted-foreground">{status.description}</p>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Score breakdown</h3>
            <ul className="space-y-3">
              {categories.map(([key, value]) => {
                const band = bandClasses(value)
                return (
                  <li key={key}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span>{CATEGORY_LABELS[key]}</span>
                      <span className={cn("font-medium tabular-nums", band.text)}>{value}/100</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn("h-full rounded-full transition-all", band.bar)}
                        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
              ATS strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atsStrengths.length === 0 ? (
              <p className="text-sm text-muted-foreground">No standout strengths were detected yet.</p>
            ) : (
              <ul className="list-disc space-y-2 pl-4 text-sm">
                {atsStrengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-yellow-600" aria-hidden="true" />
              ATS issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atsIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No major ATS-oriented issues were found.</p>
            ) : (
              <ul className="list-disc space-y-2 pl-4 text-sm">
                {atsIssues.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" />
              Improvement suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atsSuggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No additional suggestions right now.</p>
            ) : (
              <ul className="list-disc space-y-2 pl-4 text-sm">
                {atsSuggestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
