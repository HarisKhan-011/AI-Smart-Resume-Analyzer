import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth-utils"
import { getOwnedResume } from "@/services/resume-service"
import { getSkillByName, loadSkillDictionary } from "@/services/nlp/skill-dictionary"
import { ResumeAnalysisSection } from "@/components/resume/resume-analysis-section"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { FileText } from "lucide-react"

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

  const dictionary = loadSkillDictionary()
  const extractedSkills = (resume.extractedSkills ?? []).length > 0
      ? resume.extractedSkills
      : resume.skills.flatMap((name) => {
          const definition = getSkillByName(name, dictionary)
          return definition
            ? [{ name: definition.name, category: definition.category, confidence: 0.9 }]
            : []
        })

  return (
    <div className="space-y-6">
      <PageHeader
        title={resume.fileName}
        description="Extracted text, skills, and an ATS-oriented parser/readability check for this resume."
        icon={FileText}
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="uppercase">
          {resume.fileType}
        </Badge>
        <Badge
          variant={
            resume.analysisStatus === "completed"
              ? "success"
              : resume.analysisStatus === "failed"
                ? "destructive"
                : resume.analysisStatus === "processing"
                  ? "warning"
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
        <span className="text-sm text-muted-foreground">
          Uploaded {formatDate(resume.createdAt)}
        </span>
        {resume.atsAnalysisStatus === "completed" && resume.atsScore != null && (
          <Badge
            variant={
              resume.atsScore >= 80 ? "success" : resume.atsScore >= 60 ? "warning" : "destructive"
            }
          >
            ATS {resume.atsScore}/100
          </Badge>
        )}
      </div>

      <ResumeAnalysisSection
        resumeId={resume.id}
        analysisStatus={resume.analysisStatus}
        initialSkills={extractedSkills}
        initialAts={{
          atsScore: resume.atsScore,
          atsBreakdown: resume.atsBreakdown,
          atsIssues: resume.atsIssues,
          atsSuggestions: resume.atsSuggestions,
          atsStrengths: resume.atsStrengths,
          atsAnalysisStatus: resume.atsAnalysisStatus,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Extracted text</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-4 text-sm leading-relaxed">
            {resume.extractedText || "No text was extracted from this file."}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
