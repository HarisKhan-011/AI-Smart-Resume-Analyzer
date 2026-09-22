import { cn } from "@/lib/utils"

export function BrandMark({
  compact = false,
  iconOnly = false,
  className,
}: {
  compact?: boolean
  iconOnly?: boolean
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-700 text-primary-foreground shadow-sm",
          compact || iconOnly ? "h-8 w-8" : "h-9 w-9"
        )}
      >
        <span className="text-sm font-bold tracking-tight">R</span>
      </span>
      {!iconOnly && (
        <span className={cn("font-semibold tracking-tight", compact ? "text-base" : "text-lg")}>
          ResumeAI
        </span>
      )}
    </span>
  )
}
