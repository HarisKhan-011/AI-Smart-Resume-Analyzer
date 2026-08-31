import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { MapPin, Bookmark, Building2 } from "lucide-react"

export interface JobCardProps {
  id: string
  title: string
  company: string
  location: string
  employmentType?: string
  matchScore?: number | null
  skills?: string[]
  postedAt?: Date
  href?: string
  onSave?: () => void
  requiredSkillCount?: number
}

export function JobCard({
  title,
  company,
  location,
  employmentType,
  matchScore,
  skills = [],
  postedAt,
  href = "#",
  onSave,
  requiredSkillCount,
}: JobCardProps) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold">{title}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{company}</span>
            </div>
          </div>
          {matchScore != null && (
            <Badge
              variant={matchScore >= 80 ? "success" : matchScore >= 60 ? "warning" : "secondary"}
              className="shrink-0"
            >
              {matchScore}% match
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pb-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {location}
          </span>
          {employmentType && (
            <Badge variant="outline" className="text-xs">
              {employmentType}
            </Badge>
          )}
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {skills.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{skills.length - 4}
              </Badge>
            )}
          </div>
        )}
        {typeof requiredSkillCount === "number" && (
          <p className="text-sm text-muted-foreground">
            {requiredSkillCount} required skill{requiredSkillCount === 1 ? "" : "s"}
          </p>
        )}
        {postedAt && (
          <p className="text-xs text-muted-foreground">
            Posted {formatDate(postedAt)}
          </p>
        )}
      </CardContent>
      <CardFooter className="gap-2 pt-0">
        <Button asChild className="flex-1" size="sm">
          <Link href={href}>View</Link>
        </Button>
        {onSave && (
          <Button
            variant="outline"
            size="sm"
            aria-label="Save job"
            onClick={onSave}
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
