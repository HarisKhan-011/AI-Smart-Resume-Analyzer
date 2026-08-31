"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SkillBadge } from "@/components/matching/skill-badge"
import type { ExtractedSkill } from "@/types/resume"
import type { Job } from "@/types/job"

type AnalyzeJobResponse = {
  error?: string
  job?: Job
  requiredSkills?: string[]
  preferredSkills?: string[]
  detectedSkills?: ExtractedSkill[]
  alreadyExists?: boolean
}

function groupSkills(skills: ExtractedSkill[]) {
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

export function JobAnalyzeForm() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [company, setCompany] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeJobResponse | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/jobs/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, company, location, description }),
      })
      const body = (await response.json()) as AnalyzeJobResponse

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to analyze job.")
      }

      setResult(body)
      router.refresh()
    } catch (analyzeError) {
      setError(analyzeError instanceof Error ? analyzeError.message : "Unable to analyze job.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const grouped = groupSkills(result?.detectedSkills ?? [])
  const job = result?.job

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job description</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job-title">Job title</Label>
                <Input
                  id="job-title"
                  name="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Frontend Developer"
                  required
                  minLength={2}
                  disabled={isAnalyzing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-company">Company</Label>
                <Input
                  id="job-company"
                  name="company"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Acme Inc."
                  required
                  minLength={2}
                  disabled={isAnalyzing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-location">Location (optional)</Label>
              <Input
                id="job-location"
                name="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Remote"
                disabled={isAnalyzing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-description">Job description</Label>
              <Textarea
                id="job-description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Paste the full job description, including required and preferred skills."
                className="min-h-[180px]"
                required
                disabled={isAnalyzing}
              />
            </div>
            <Button type="submit" disabled={isAnalyzing}>
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              {isAnalyzing ? "Analyzing..." : "Analyze Job"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analysis failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {job && (
        <div className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>
              {result?.alreadyExists ? "Existing job updated" : "Job analyzed"}
            </AlertTitle>
            <AlertDescription>
              {result?.requiredSkills?.length ?? 0} required skill
              {(result?.requiredSkills?.length ?? 0) === 1 ? "" : "s"} detected.
              <Button asChild variant="link" className="h-auto px-1">
                <Link href={`/jobs/${job.id}`}>View saved job</Link>
              </Button>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><span className="font-medium">Title:</span> {job.title}</p>
              <p><span className="font-medium">Company:</span> {job.company}</p>
              <p><span className="font-medium">Location:</span> {job.location}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <SkillList
                skills={result?.requiredSkills ?? []}
                empty="No required skills were detected."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preferred Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <SkillList
                skills={result?.preferredSkills ?? []}
                empty="No preferred skills were detected."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">Detected Skills</CardTitle>
              <Badge variant="outline">
                {result?.detectedSkills?.length ?? 0} skill
                {(result?.detectedSkills?.length ?? 0) === 1 ? "" : "s"}
              </Badge>
            </CardHeader>
            <CardContent>
              {grouped.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No dictionary skills were found in this description.
                </p>
              ) : (
                <div className="space-y-5">
                  {grouped.map((group) => (
                    <div key={group.category}>
                      <h3 className="mb-2 text-sm font-semibold">{group.category}</h3>
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
      )}
    </div>
  )
}
