import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionText?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-muted/40 px-6 py-10 text-center sm:px-12 sm:py-14">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {actionText && actionHref && (
        <Button asChild>
          <Link href={actionHref}>{actionText}</Link>
        </Button>
      )}
      {actionText && onAction && !actionHref && (
        <Button onClick={onAction}>{actionText}</Button>
      )}
    </div>
  )
}
