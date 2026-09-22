import Link from "next/link"
import {
  Compass,
  Eye,
  FileText,
  GraduationCap,
  MessageCircle,
  Search,
  Sparkles,
  TrendingUp,
  Upload,
  Wand2,
} from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { SkillBadge } from "@/components/matching/skill-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import type { AtsBreakdown } from "@/types/resume"
import type { CareerIntelligenceSnapshot } from "@/types/career-intelligence"

const ATS_CATEGORY_LABELS: Record<keyof AtsBreakdown, string> = {
  contact: "Contact",
  sections: "Sections",
  keywords: "Keywords",
  readability: "Readability",
  experience: "Experience",
  completeness: "Completeness",
}

const QUICK_ACTIONS = [
  { href: "/resume", label: "Check ATS", description: "Open your resume ATS report", icon: FileText },
  { href: "/job-match", label: "Job Match", description: "Compare a resume with a target role", icon: Search },
  { href: "/skill-gap", label: "Skill Gap", description: "See missing skills for a role", icon: TrendingUp },
  { href: "/industry-insights", label: "Industry Insights", description: "Map your skills to a target industry", icon: Compass },
  { href: "/resume-improve", label: "Improve Resume", description: "Rewrite sections without inventing facts", icon: Wand2 },
  { href: "/career-assistant", label: "Career Assistant", description: "Ask grounded career questions", icon: MessageCircle },
  { href: "/interview-prep", label: "Interview Prep", description: "Practice questions from your resume", icon: GraduationCap },
] as const

function scoreLabel(value: number | null, suffix = "%"): string {
  return value == null ? "—" : `${value}${suffix}`
}

function barWidth(value: number, max: number): string {
  if (max <= 0) return "0%"
  return `${Math.max(0, Math.min(100, Math.round((value / max) * 100)))}%`
}

function MetricBar({
  label,
  value,
  display,
  max = 100,
}: {
  label: string
  value: number
  display?: string
  max?: number
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate">{label}</span>
        <span className="shrink-0 text-muted-foreground">{display ?? value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: barWidth(value, max) }} />
      </div>
    </div>
  )
}

export function CareerIntelligenceDashboard({ data }: { data: CareerIntelligenceSnapshot }) {
  const {
    primaryResume,
    recentResumes,
    atsScore,
    jobMatchScore,
    jobMatchLabel,
    skillCoverage,
    currentSkills,
    missingSkills,
    persistedMatches,
    resumeCount,
    industryInsights,
  } = data

  const atsHref = primaryResume ? `/resume/${primaryResume.id}` : "/resume/upload"
  const hasAtsBreakdown = Boolean(primaryResume?.atsBreakdown && atsScore != null)

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="ATS Score"
          value={scoreLabel(atsScore)}
          icon={FileText}
          description={
            atsScore != null
              ? primaryResume?.fileName
              : primaryResume
                ? "Analyze this resume to see ATS"
                : "Upload a resume first"
          }
        />
        <StatCard
          title="Job Match Score"
          value={scoreLabel(jobMatchScore)}
          icon={Sparkles}
          description={jobMatchLabel ?? (primaryResume ? "No saved match yet" : "Analyze a resume first")}
        />
        <StatCard
          title="Skill Coverage"
          value={scoreLabel(skillCoverage)}
          icon={TrendingUp}
          description={
            skillCoverage != null
              ? "From your best saved role match"
              : "Run Job Match to measure coverage"
          }
        />
        <StatCard
          title="Resumes"
          value={resumeCount}
          icon={FileText}
          description={resumeCount ? "Uploaded by you" : "No resume uploaded yet"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">Quick actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              const href = action.href === "/resume" ? atsHref : action.href
              return (
                <Link
                  key={action.label}
                  href={href}
                  className="group flex items-start gap-3 rounded-2xl border bg-background p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lift"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold tracking-tight">{action.label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{action.description}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Industry insights</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/industry-insights">Open insights</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!industryInsights ? (
            <EmptyState
              icon={Compass}
              title="No industry signal yet"
              description="Analyze a resume with extracted skills to see industry fit, outlook, and in-demand skills."
              actionText="Upload Resume"
              actionHref="/resume/upload"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{industryInsights.industryName}</Badge>
                <Badge variant={industryInsights.outlook === "Growing" ? "success" : "secondary"}>
                  {industryInsights.outlook}
                </Badge>
                <Badge variant="secondary">{industryInsights.fitScore}% skill fit</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {industryInsights.matchedCount} of {industryInsights.inDemandCount} in-demand skills for this
                industry are already on your resume.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Resume performance</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href={atsHref}>Check ATS</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!primaryResume ? (
              <EmptyState
                icon={FileText}
                title="No resume uploaded yet"
                description="Upload a resume to see ATS score and extracted skills."
                actionText="Upload Resume"
                actionHref="/resume/upload"
              />
            ) : !hasAtsBreakdown ? (
              <EmptyState
                icon={FileText}
                title="ATS score not ready"
                description="Analyze your resume to generate a real ATS score and category breakdown."
                actionText="Open resume"
                actionHref={atsHref}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{primaryResume.fileName}</Badge>
                  <Badge variant={atsScore != null && atsScore >= 70 ? "success" : "warning"}>
                    ATS {atsScore}/100
                  </Badge>
                </div>
                <div className="space-y-3">
                  {(Object.keys(ATS_CATEGORY_LABELS) as Array<keyof AtsBreakdown>).map((key) => (
                    <MetricBar
                      key={key}
                      label={ATS_CATEGORY_LABELS[key]}
                      value={primaryResume.atsBreakdown?.[key] ?? 0}
                      display={`${primaryResume.atsBreakdown?.[key] ?? 0}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Skills</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/skill-gap">Skill Gap</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!currentSkills.length && !missingSkills.length ? (
              <EmptyState
                icon={TrendingUp}
                title="No skill data yet"
                description="Analyze a resume and run Job Match to see current skills and real gaps."
                actionText="Analyze resume"
                actionHref="/resume"
              />
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Current skills</p>
                  {currentSkills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No extracted skills on the selected resume.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {currentSkills.map((skill) => (
                        <SkillBadge key={skill} skill={skill} status="matched" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium">Missing skills</p>
                  {missingSkills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No missing skills from saved role matches.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {missingSkills.map((skill) => (
                        <SkillBadge key={skill} skill={skill} status="missing" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Resumes</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/resume/upload">
                <Upload className="mr-1 h-4 w-4" />
                Upload Resume
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentResumes.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No resume uploaded yet."
                description="Upload your resume to extract text and prepare it for analysis."
                actionText="Upload Resume"
                actionHref="/resume/upload"
              />
            ) : (
              <ul className="divide-y">
                {recentResumes.map((resume) => (
                  <li
                    key={resume.id}
                    className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{resume.fileName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="uppercase">
                          {resume.fileType}
                        </Badge>
                        <Badge
                          variant={
                            resume.analysisStatus === "completed"
                              ? "success"
                              : resume.analysisStatus === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {resume.analysisStatus === "completed"
                            ? "Analyzed"
                            : resume.analysisStatus === "failed"
                              ? "Failed"
                              : resume.analysisStatus === "processing"
                                ? "Processing"
                                : "Pending analysis"}
                        </Badge>
                        {resume.atsAnalysisStatus === "completed" && resume.atsScore != null && (
                          <Badge variant="secondary">ATS {resume.atsScore}</Badge>
                        )}
                        <span>{formatDate(resume.createdAt)}</span>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/resume/${resume.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent role matches</CardTitle>
          </CardHeader>
          <CardContent>
            {persistedMatches.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No role matches yet"
                description="Analyze a resume and compare it with a job description."
                actionText="Check Job Match"
                actionHref="/job-match"
              />
            ) : (
              <ul className="divide-y">
                {persistedMatches.slice(0, 5).map((item) => (
                  <li key={item.jobId} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.jobTitle ?? "Saved match"}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {item.company ?? "Role details unavailable"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.overallScore >= 80 ? "success" : item.overallScore >= 60 ? "warning" : "secondary"
                      }
                    >
                      {item.overallScore}%
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
