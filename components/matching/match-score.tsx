import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MatchScoreProps {
  score: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function MatchScore({ score, size = "md", showLabel = true }: MatchScoreProps) {
  const sizeClasses = {
    sm: "h-20 w-20",
    md: "h-32 w-32",
    lg: "h-48 w-48"
  }

  const textSizes = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl"
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card className="flex items-center justify-center">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className={cn("relative flex items-center justify-center rounded-full border-4", sizeClasses[size])}>
          <svg className="absolute inset-0 h-full w-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="42%"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <circle
              cx="50%"
              cy="50%"
              r="42%"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${score * 2.64} 264`}
              className={getProgressColor(score)}
              strokeLinecap="round"
            />
          </svg>
          <div className="flex flex-col items-center">
            <span className={cn("font-bold", textSizes[size], getScoreColor(score))}>
              {score}%
            </span>
            {showLabel && (
              <span className="text-xs text-muted-foreground">Match</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
