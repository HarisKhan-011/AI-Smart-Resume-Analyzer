import { PageHeader } from "@/components/shared/page-header"
import { ResumeUploadForm } from "@/components/resume/resume-upload-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload } from "lucide-react"

export default function ResumeUploadPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Resume"
        description="Upload a PDF or DOCX resume. Text is extracted immediately; open the resume to run skill analysis."
        icon={Upload}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resume file</CardTitle>
          <CardDescription>
            Supported formats: PDF and DOCX. Maximum size: 5MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeUploadForm />
        </CardContent>
      </Card>
    </div>
  )
}
