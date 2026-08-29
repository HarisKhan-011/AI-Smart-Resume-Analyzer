import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

const candidatePoints = [
  "Upload resume",
  "Analyze skills",
  "Compare jobs",
  "Find missing skills",
  "Track applications",
]

export function ForCandidatesSection() {
  return (
    <section id="for-candidates" className="container mx-auto px-4 py-16 sm:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">For Candidates</h2>
          <p className="mt-4 text-muted-foreground">
            Take control of your job search with AI-powered resume analysis and smart matching.
          </p>
          <ul className="mt-8 space-y-3">
            {candidatePoints.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <Button className="mt-8" size="lg" asChild>
            <Link href="/resume/upload">Start Analyzing</Link>
          </Button>
        </div>
        <div className="rounded-xl border bg-muted/30 p-8">
          <div className="space-y-4">
            <div className="rounded-lg bg-background p-4 shadow-sm">
              <p className="text-sm font-medium">Resume Score</p>
              <p className="text-3xl font-bold text-muted-foreground">--%</p>
            </div>
            <div className="rounded-lg bg-background p-4 shadow-sm">
              <p className="text-sm font-medium">Skills Found</p>
              <p className="text-3xl font-bold text-muted-foreground">--</p>
            </div>
            <div className="rounded-lg bg-background p-4 shadow-sm">
              <p className="text-sm font-medium">Jobs Matched</p>
              <p className="text-3xl font-bold text-muted-foreground">--</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
