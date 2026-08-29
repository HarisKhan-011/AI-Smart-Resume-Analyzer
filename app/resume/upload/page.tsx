import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { Upload } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"
import { FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResumeUploadPage() {
  return (
    <div className="space-y-6">
      <FeaturePlaceholder
        title="My Resumes"
        description="Upload and manage your resumes for AI analysis."
        icon={Upload}
        actionLabel="Go to Dashboard"
        actionHref="/dashboard"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Resumes</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="No resumes uploaded"
            description="Upload your resume to start your AI analysis."
            actionText="Upload Resume"
            actionHref="/resume/upload"
          />
        </CardContent>
      </Card>
    </div>
  )
}
