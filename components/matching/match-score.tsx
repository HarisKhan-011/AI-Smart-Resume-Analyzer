import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MatchScoreProps {
  score: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

const sizeClasses = {
  sm: "h-20 w-20",
  md: "h-32 w-32",
  lg: "h-40 w-40",
}

const textSizes = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-4xl",
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(100, Math.round(score)))
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-500"
  if (score >= 60) return "text-yellow-500"
  return "text-red-500"
}

function strokeColor(score: number): string {
  if (score >= 80) return "stroke-green-500"
  if (score >= 60) return "stroke-yellow-500"
  return "stroke-red-500"
}

export function MatchScore({ score, size = "md", showLabel = true }: MatchScoreProps) {
  const value = clampScore(score)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (value / 100) * circumference

  return (
    <Card className="flex items-center justify-center">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div
          className={cn("relative flex items-center justify-center", sizeClasses[size])}
          role="img"
          aria-label={`${value} percent match`}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth="8"
              className="stroke-muted"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={strokeColor(value)}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={cn("font-bold", textSizes[size], scoreColor(value))}>
              {value}%
            </span>
            {showLabel && <span className="text-xs text-muted-foreground">Match</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
