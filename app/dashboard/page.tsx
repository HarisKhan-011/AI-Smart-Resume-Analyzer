import Link from "next/link"
import { StatCard } from "@/components/dashboard/stat-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Briefcase,
  ClipboardList,
  Sparkles,
  TrendingUp,
  Upload,
} from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your resume analysis and job matching activity."
        icon={Sparkles}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Resume Score" value="--%" icon={FileText} description="No analysis yet" />
        <StatCard title="Jobs Matched" value="--" icon={Briefcase} description="Upload resume first" />
        <StatCard title="Applications" value="--" icon={ClipboardList} description="Not tracked yet" />
        <StatCard title="Skills Found" value="--" icon={Sparkles} description="Pending analysis" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Resume</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/resume/upload">
                <Upload className="mr-1 h-4 w-4" />
                Upload Resume
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={FileText}
              title="No resume analyzed yet"
              description="Upload your resume to start your AI analysis."
              actionText="Upload Resume"
              actionHref="/resume/upload"
            />
          </CardContent>
        </Card>

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
            <CardTitle className="text-lg">Top Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Sparkles}
              title="No skills detected"
              description="Upload and analyze your resume to discover your skills."
              actionText="Upload Resume"
              actionHref="/resume/upload"
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recommended Jobs</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/recommendations">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Briefcase}
            title="No recommendations yet"
            description="Complete your resume analysis to receive personalized job recommendations."
            actionText="Explore Jobs"
            actionHref="/jobs"
          />
        </CardContent>
      </Card>
    </div>
  )
}
