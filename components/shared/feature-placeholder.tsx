import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface FeaturePlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
  actionLabel?: string
  actionHref?: string
}

export function FeaturePlaceholder({
  title,
  description,
  icon: Icon,
  actionLabel,
  actionHref,
}: FeaturePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-lg font-semibold">Coming in a future phase</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            {title} functionality will be connected in a later development phase.
            This page is a placeholder for the UI shell.
          </p>
          {actionLabel && actionHref && (
            <Button asChild variant="outline">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
