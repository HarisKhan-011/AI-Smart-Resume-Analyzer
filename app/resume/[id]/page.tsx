import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth-utils"
import { getOwnedResume } from "@/services/resume-service"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { FileText, Sparkles } from "lucide-react"

interface ResumeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ResumeDetailPage({ params }: ResumeDetailPageProps) {
  const user = await requireAuth()
  const { id } = await params
  const resume = await getOwnedResume(id, user.id)

  if (!resume) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={resume.fileName}
          description="Extracted resume text. Skill analysis will be added in a later phase."
          icon={FileText}
        />
        <Button asChild>
          <Link href={`/resume/analysis?resumeId=${resume.id}`}>
            <Sparkles className="h-4 w-4" />
            Analyze
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="uppercase">
          {resume.fileType}
        </Badge>
        <Badge variant="secondary">{resume.analysisStatus}</Badge>
        <span className="text-sm text-muted-foreground">
          Uploaded {formatDate(resume.createdAt)}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Extracted text</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm leading-relaxed">
            {resume.extractedText || "No text was extracted from this file."}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
