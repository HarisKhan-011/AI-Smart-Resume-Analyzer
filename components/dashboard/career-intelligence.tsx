import Link from "next/link"
import {
  Bookmark,
  Briefcase,
  ClipboardList,
  Eye,
  FileText,
  Gift,
  GraduationCap,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  Upload,
  Wand2,
  XCircle,
} from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { JobCard } from "@/components/jobs/job-card"
import { SkillBadge } from "@/components/matching/skill-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  APPLICATION_STATUS_ORDER,
  applicationStatusLabel,
} from "@/services/applications/status"
import { formatDate } from "@/lib/utils"
import type { AtsBreakdown } from "@/types/resume"
import type { CareerIntelligenceSnapshot } from "@/types/career-intelligence"

const APPLICATION_STATUS_ICONS = {
  saved: Bookmark,
  applied: Send,
  interview: MessageSquare,
  offered: Gift,
  rejected: XCircle,
} as const

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
  { href: "/jobs", label: "Find Jobs", description: "Search roles that fit your skills", icon: Search },
  { href: "/skill-gap", label: "Skill Gap", description: "Compare resume skills to a job", icon: TrendingUp },
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
    applicationCounts,
    applicationTotal,
    recommendedJobs,
    persistedMatches,
    resumeCount,
  } = data

  const atsHref = primaryResume ? `/resume/${primaryResume.id}` : "/resume/upload"
  const applicationMax = Math.max(applicationTotal, 1)
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
              ? "From your best saved match or recommendation"
              : "Check a job match to measure coverage"
          }
        />
        <StatCard
          title="Missing Skills"
          value={missingSkills.length}
          icon={Lightbulb}
          description={missingSkills.length ? "From saved matches and recommendations" : "No gap data yet"}
        />
        <StatCard
          title="Saved Jobs"
          value={applicationCounts.saved}
          icon={Bookmark}
          description="Tracked in your pipeline"
        />
        <StatCard
          title="Applied Jobs"
          value={applicationCounts.applied}
          icon={Send}
          description="Tracked in your pipeline"
        />
        <StatCard
          title="Interviews"
          value={applicationCounts.interview}
          icon={MessageSquare}
          description="Tracked in your pipeline"
        />
        <StatCard
          title="Recommended Jobs"
          value={recommendedJobs.length}
          icon={Briefcase}
          description={recommendedJobs.length ? "Ranked from your resume" : "Analyze a resume to rank jobs"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick actions</CardTitle>
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
                  className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-medium">{action.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{action.description}</span>
                  </span>
                </Link>
              )
            })}
          </div>
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
                  <Badge variant="secondary">{resumeCount} resume{resumeCount === 1 ? "" : "s"}</Badge>
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
            <CardTitle className="text-lg">Application status</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/applications">View applications</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {applicationTotal === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No applications tracked"
                description="Save or apply to a job to populate this funnel from MongoDB."
                actionText="Find jobs"
                actionHref="/jobs"
              />
            ) : (
              <div className="space-y-4">
                {APPLICATION_STATUS_ORDER.map((status) => {
                  const Icon = APPLICATION_STATUS_ICONS[status]
                  const count = applicationCounts[status]
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          {applicationStatusLabel(status)}
                        </span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: barWidth(count, applicationMax) }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
              description="Analyze a resume and check a job match to see current skills and real gaps."
              actionText="Analyze resume"
              actionHref="/resume"
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
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
                  <p className="text-sm text-muted-foreground">
                    No missing skills from saved matches or recommendations.
                  </p>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/jobs" method="GET" className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="dashboard-job-keyword">Keyword</Label>
              <Input id="dashboard-job-keyword" name="keyword" placeholder="React, Python, designer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dashboard-job-location">Location</Label>
              <Input
                id="dashboard-job-location"
                name="location"
                defaultValue="Pakistan"
                placeholder="Lahore, Karachi, Islamabad"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full sm:w-auto">
                <Search className="h-4 w-4" />
                Search Jobs
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recommended for You</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/recommendations">
              <Lightbulb className="mr-1 h-4 w-4" />
              View all
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recommendedJobs.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="No recommendations yet"
              description="Analyze a resume and search jobs so we can rank the best matches for you."
              actionText="View recommendations"
              actionHref="/recommendations"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedJobs.slice(0, 3).map((item) => (
                <JobCard
                  key={item.jobId}
                  id={item.job.id}
                  title={item.job.title}
                  company={item.job.company}
                  location={item.job.location}
                  employmentType={item.job.employmentType}
                  matchScore={item.overallScore}
                  skills={item.matchedSkills}
                  missingSkills={item.missingSkills}
                  href={`/jobs/${item.job.id}`}
                  checkMatchHref={`/job-match?jobId=${item.job.id}`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
            <CardTitle className="text-lg">Recent job matches</CardTitle>
          </CardHeader>
          <CardContent>
            {persistedMatches.length === 0 && recommendedJobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No job matches yet"
                description="Analyze a resume and check a job to save a real match score."
                actionText="Check Job Match"
                actionHref="/job-match"
              />
            ) : (
              <ul className="divide-y">
                {(persistedMatches.length ? persistedMatches : recommendedJobs.slice(0, 3).map((item) => ({
                  jobId: item.jobId,
                  jobTitle: item.job.title,
                  company: item.job.company,
                  overallScore: item.overallScore,
                  skillScore: item.skillScore,
                  matchedSkills: item.matchedSkills,
                  missingSkills: item.missingSkills,
                }))).slice(0, 5).map((item) => (
                  <li key={item.jobId} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.jobTitle ?? "Saved match"}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {item.company ?? "Job details unavailable"}
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
