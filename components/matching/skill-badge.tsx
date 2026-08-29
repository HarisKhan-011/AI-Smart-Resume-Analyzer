import { Badge } from "@/components/ui/badge"
import { Check, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SkillBadgeProps {
  skill: string
  status?: "matched" | "missing" | "preferred"
  size?: "sm" | "md"
}

export function SkillBadge({ skill, status = "matched", size = "md" }: SkillBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1"
  }

  const statusConfig = {
    matched: {
      variant: "success" as const,
      icon: <Check className="h-3 w-3" />,
      label: "Matched"
    },
    missing: {
      variant: "destructive" as const,
      icon: <X className="h-3 w-3" />,
      label: "Missing"
    },
    preferred: {
      variant: "warning" as const,
      icon: <AlertCircle className="h-3 w-3" />,
      label: "Preferred"
    }
  }

  const config = statusConfig[status]

  return (
    <Badge 
      variant={config.variant} 
      className={cn("flex items-center gap-1", sizeClasses[size])}
    >
      {config.icon}
      {skill}
    </Badge>
  )
}
