import Link from "next/link"
import { requireAuth } from "@/lib/auth-utils"
import { listResumesByUser } from "@/services/resume-service"
import { StatCard } from "@/components/dashboard/stat-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  FileText,
  Briefcase,
  ClipboardList,
  Sparkles,
  TrendingUp,
  Upload,
  Eye,
  Search,
} from "lucide-react"

export default async function DashboardPage() {
  const user = await requireAuth()
  const resumes = await listResumesByUser(user.id)
  const recentResumes = resumes.slice(0, 5)

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
        <StatCard title="Resume Score" value="--%" icon={Sparkles} description="No analysis yet" />
        <StatCard title="Jobs Matched" value="--" icon={Briefcase} description="Upload resume first" />
        <StatCard title="Applications" value="--" icon={ClipboardList} description="Not tracked yet" />
      </div>

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
                placeholder="Remote, London"
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
                      <span className="capitalize">{resume.analysisStatus}</span>
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
            <CardTitle className="text-lg">Recent Job Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Briefcase}
              title="No job matches yet"
              description="Analyze a job description to see your compatibility."
              actionText="Check Job Match"
              actionHref="/job-match"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skill Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={TrendingUp}
              title="No skill gaps identified"
              description="Compare your resume with a job to find skill gaps."
              actionText="View Skill Gap"
              actionHref="/skill-gap"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
