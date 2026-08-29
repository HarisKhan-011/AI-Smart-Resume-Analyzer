import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { FileText, Eye, Sparkles } from "lucide-react"

export interface ResumeCardProps {
  id: string
  fileName: string
  uploadedAt?: Date
  score?: number | null
  status?: "pending" | "analyzed" | "failed"
  viewHref?: string
  analyzeHref?: string
}

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const },
  analyzed: { label: "Analyzed", variant: "success" as const },
  failed: { label: "Failed", variant: "destructive" as const },
}

export function ResumeCard({
  fileName,
  uploadedAt,
  score,
  status = "pending",
  viewHref = "#",
  analyzeHref = "#",
}: ResumeCardProps) {
  const statusInfo = statusConfig[status]

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-medium">{fileName}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
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
        <div className="flex items-center gap-3 sm:shrink-0">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-lg font-bold">
              {score != null ? `${score}%` : "--"}
            </p>
          </div>
          <div className="flex gap-2">
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
        </div>
      </CardContent>
    </Card>
  )
}
