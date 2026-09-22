import Link from "next/link"
import { Briefcase, Compass, LineChart, Sparkles, TrendingUp } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"
import { SkillBadge } from "@/components/matching/skill-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { IndustryInsightsResult } from "@/types/industry-insights"

function outlookVariant(outlook: IndustryInsightsResult["outlook"]) {
  return outlook === "Growing" ? "success" : "secondary"
}

export function IndustryInsightsPanel({ insights }: { insights: IndustryInsightsResult | null }) {
  if (!insights) {
    return (
      <EmptyState
        icon={Compass}
        title="Industry insights need extracted skills"
        description="Upload and analyze a resume so we can map your skills to a target industry. We do not invent a market from an empty file."
        actionText="Upload Resume"
        actionHref="/resume/upload"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Detected industry</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{insights.industryName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{insights.resumeFileName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Skill fit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{insights.fitScore}%</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {insights.matchedCount} of {insights.inDemandCount} in-demand skills on your resume
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outlook</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={outlookVariant(insights.outlook)}>{insights.outlook}</Badge>
            <p className="mt-2 text-sm text-muted-foreground">{insights.outlookNote}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Typical range</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{insights.salaryRange}</p>
            <p className="mt-1 text-sm text-muted-foreground">Curated baseline, not a live salary feed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LineChart className="h-5 w-5 text-primary" aria-hidden="true" />
            Market snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{insights.summary}</p>
          <p>
            <span className="font-medium text-foreground">Hiring focus: </span>
            {insights.hiringFocus}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">In-demand skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {insights.skillCoverage.map((item) => (
                <SkillBadge
                  key={item.skill}
                  skill={item.skill}
                  status={item.present ? "matched" : "missing"}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Green skills are already on this resume. Red skills are common in {insights.industryName} and missing here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-primary" aria-hidden="true" />
              Typical roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {insights.typicalRoles.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
            {insights.nextSkills.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Learn next</p>
                <div className="flex flex-wrap gap-2">
                  {insights.nextSkills.map((skill) => (
                    <SkillBadge key={skill} skill={skill} status="missing" />
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/skill-gap">
                  <TrendingUp className="h-4 w-4" />
                  Skill Gap
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/career-roadmap">
                  <Sparkles className="h-4 w-4" />
                  Career Roadmap
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {insights.alternatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Close alternative industries</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {insights.alternatives.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <p className="font-medium">{item.name}</p>
                  <Badge variant="secondary">{item.fitScore}% skill fit</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">{insights.disclaimer}</p>
    </div>
  )
}
