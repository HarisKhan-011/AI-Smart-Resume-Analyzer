import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import type { AnalysisStatus } from "@/types/resume"
import { FileText, Eye, Sparkles } from "lucide-react"

export interface ResumeCardProps {
  id: string
  fileName: string
  fileType?: string
  uploadedAt?: Date
  analysisStatus?: AnalysisStatus
  viewHref?: string
  analyzeHref?: string
}

const statusConfig: Record<
  AnalysisStatus,
  { label: string; variant: "secondary" | "warning" | "success" | "destructive" }
> = {
  pending: { label: "Pending analysis", variant: "secondary" },
  processing: { label: "Processing", variant: "warning" },
  completed: { label: "Analyzed", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
}

export function ResumeCard({
  fileName,
  fileType,
  uploadedAt,
  analysisStatus = "pending",
  viewHref = "#",
  analyzeHref = "#",
}: ResumeCardProps) {
  const statusInfo = statusConfig[analysisStatus]

  return (
    <Card className="transition-shadow hover:shadow-lift">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-medium">{fileName}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {fileType && (
                <Badge variant="outline" className="text-xs uppercase">
                  {fileType}
                </Badge>
              )}
              {uploadedAt && (
                <span className="text-xs text-muted-foreground">
                  Uploaded {formatDate(uploadedAt)}
                </span>
              )}
              <Badge variant={statusInfo.variant} className="text-xs">
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2 sm:shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href={viewHref}>
              <Eye className="mr-1 h-4 w-4" />
              View
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={analyzeHref}>
              <Sparkles className="mr-1 h-4 w-4" />
              Analyze
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
