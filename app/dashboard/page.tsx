import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { listResumesByUser } from "@/services/resume-service"
import { recommendJobsForUser } from "@/services/recommendations/recommendation-service"
import { countOwnedApplicationsByStatus } from "@/services/applications/application-service"
import {
  APPLICATION_STATUS_ORDER,
  applicationStatusLabel,
} from "@/services/applications/status"
import { StatCard } from "@/components/dashboard/stat-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { JobCard } from "@/components/jobs/job-card"
import {
  FileText,
  Briefcase,
  ClipboardList,
  Sparkles,
  TrendingUp,
  Upload,
  Eye,
  Search,
  Lightbulb,
  Bookmark,
  Send,
  MessageSquare,
  Gift,
  XCircle,
} from "lucide-react"

const APPLICATION_STATUS_ICONS = {
  saved: Bookmark,
  applied: Send,
  interview: MessageSquare,
  offered: Gift,
  rejected: XCircle,
} as const

export default async function DashboardPage() {
  const user = await requireAuth()
  const resumes = await listResumesByUser(user.id)
  const recentResumes = resumes.slice(0, 5)
  const analyzedResume = resumes.find((resume) => resume.skills.length > 0)

  const applicationCounts = await countOwnedApplicationsByStatus(user.id)
  const applicationTotal = APPLICATION_STATUS_ORDER.reduce(
    (sum, status) => sum + applicationCounts[status],
    0
  )

  let recommendedJobs: Awaited<ReturnType<typeof recommendJobsForUser>>["recommendations"] = []
  if (analyzedResume) {
    try {
      const result = await recommendJobsForUser(user.id, analyzedResume.id)
      recommendedJobs = result.recommendations
    } catch {
      recommendedJobs = []
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your resume analysis and job matching activity."
        icon={Sparkles}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Resumes"
          value={resumes.length}
          icon={FileText}
          description={resumes.length ? "Uploaded" : "No resume uploaded yet"}
        />
        <StatCard
          title="Best match"
          value={recommendedJobs[0] ? `${recommendedJobs[0].overallScore}%` : "--%"}
          icon={Sparkles}
          description={
            recommendedJobs[0]
              ? recommendedJobs[0].job.title
              : analyzedResume
                ? "No matching jobs yet"
                : "Analyze a resume first"
          }
        />
        <StatCard
          title="Jobs Matched"
          value={recommendedJobs.length ? recommendedJobs.length : "--"}
          icon={Briefcase}
          description={recommendedJobs.length ? "Suitable jobs ranked" : "Analyze a resume first"}
        />
        <StatCard
          title="Applications"
          value={applicationTotal}
          icon={ClipboardList}
          description={applicationTotal ? "Tracked in your pipeline" : "No applications tracked yet"}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Application Overview</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/applications">View applications</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {APPLICATION_STATUS_ORDER.map((status) => {
              const Icon = APPLICATION_STATUS_ICONS[status]
              return (
                <StatCard
                  key={status}
                  title={applicationStatusLabel(status)}
                  value={applicationCounts[status]}
                  icon={Icon}
                  description="From your tracked jobs"
                />
              )
            })}
          </div>
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
              <Input
                id="dashboard-job-keyword"
                name="keyword"
                placeholder="React, Python, designer"
              />
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
                <li key={resume.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent job matches</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendedJobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No job matches yet"
                description="Analyze a resume and search jobs to see compatibility scores."
                actionText="Check Job Match"
                actionHref="/job-match"
              />
            ) : (
              <ul className="divide-y">
                {recommendedJobs.slice(0, 3).map((item) => (
                  <li key={item.jobId} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.job.title}</p>
                      <p className="truncate text-sm text-muted-foreground">{item.job.company}</p>
                    </div>
                    <Badge
                      variant={item.overallScore >= 80 ? "success" : item.overallScore >= 60 ? "warning" : "secondary"}
                    >
                      {item.overallScore}%
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skill gaps</CardTitle>
          </CardHeader>
          <CardContent>
            {!recommendedJobs[0]?.missingSkills.length ? (
              <EmptyState
                icon={TrendingUp}
                title="No skill gaps identified"
                description="Compare your resume with a job to find missing required skills."
                actionText="View Skill Gap"
                actionHref="/skill-gap"
              />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Missing required skills for {recommendedJobs[0].job.title}.
                </p>
                <div className="flex flex-wrap gap-2">
                  {recommendedJobs[0].missingSkills.slice(0, 8).map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/skill-gap">View skill gap</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
