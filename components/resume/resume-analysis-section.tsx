"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SkillBadge } from "@/components/matching/skill-badge"
import type { AnalysisStatus, ExtractedSkill } from "@/types/resume"

function groupSkillsByCategory(skills: ExtractedSkill[]) {
  const groups = new Map<string, ExtractedSkill[]>()
  for (const skill of skills) {
    const current = groups.get(skill.category) ?? []
    current.push(skill)
    groups.set(skill.category, current)
  }
  return Array.from(groups.entries()).map(([category, grouped]) => ({
    category,
    skills: grouped,
  }))
}

type ResumeAnalysisSectionProps = {
  resumeId: string
  analysisStatus: AnalysisStatus
  initialSkills: ExtractedSkill[]
}

export function ResumeAnalysisSection({
  resumeId,
  analysisStatus,
  initialSkills,
}: ResumeAnalysisSectionProps) {
  const router = useRouter()
  const [skills, setSkills] = useState(initialSkills)
  const [status, setStatus] = useState(analysisStatus)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    setSkills(initialSkills)
    setStatus(analysisStatus)
  }, [analysisStatus, initialSkills])

  async function analyzeResume() {
    setIsAnalyzing(true)
    setError(null)
    setSuccess(null)
    setStatus("processing")

    try {
      const response = await fetch(`/api/resumes/${resumeId}/analyze`, {
        method: "POST",
      })
      const body = (await response.json()) as {
        error?: string
        skills?: ExtractedSkill[]
        skillCount?: number
      }

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to analyze resume.")
      }

      const nextSkills = body.skills ?? []
      setSkills(nextSkills)
      setStatus("completed")
      setSuccess(
        nextSkills.length
          ? `Analysis complete. ${nextSkills.length} skill${nextSkills.length === 1 ? "" : "s"} detected.`
          : "Analysis complete. No listed skills were detected in this resume."
      )
      router.refresh()
    } catch (analyzeError) {
      setStatus("failed")
      setError(analyzeError instanceof Error ? analyzeError.message : "Unable to analyze resume.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const grouped = groupSkillsByCategory(skills)
  const buttonLabel =
    status === "completed" || skills.length > 0 ? "Re-analyze Resume" : "Analyze Resume"

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Detect skills from the extracted resume text. Job matching comes in a later phase.
        </p>
        <Button type="button" onClick={analyzeResume} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          {isAnalyzing ? "Analyzing..." : buttonLabel}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analysis failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Resume analyzed</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Extracted Skills</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status === "completed" ? "success" : status === "failed" ? "destructive" : "secondary"}>
              {status}
            </Badge>
            <Badge variant="outline">{skills.length} skill{skills.length === 1 ? "" : "s"} detected</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <p className="text-sm text-muted-foreground">Running NLP skill extraction...</p>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {status === "failed"
                ? "Analysis did not complete. Try again."
                : "No skills detected yet. Click Analyze Resume to extract skills."}
            </p>
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.category}>
                  <h3 className="mb-3 text-sm font-semibold">{group.category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill) => (
                      <SkillBadge key={skill.name} skill={skill.name} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
