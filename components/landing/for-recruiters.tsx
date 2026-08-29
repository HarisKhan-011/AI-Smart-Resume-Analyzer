import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

const recruiterPoints = [
  "Create job postings",
  "Upload candidate resumes",
  "Analyze resumes automatically",
  "Rank candidates by fit",
  "Compare candidates side by side",
]

export function ForRecruitersSection() {
  return (
    <section id="for-recruiters" className="bg-muted/30 py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1 rounded-xl border bg-background p-8">
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-medium">Active Jobs</p>
                <p className="text-3xl font-bold text-muted-foreground">--</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-medium">Candidates</p>
                <p className="text-3xl font-bold text-muted-foreground">--</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-medium">Top Match</p>
                <p className="text-3xl font-bold text-muted-foreground">--%</p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">For Recruiters</h2>
            <p className="mt-4 text-muted-foreground">
              Streamline hiring with intelligent candidate analysis and ranking tools.
            </p>
            <ul className="mt-8 space-y-3">
              {recruiterPoints.map((point) => (
                <li key={point} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-8" size="lg" asChild>
              <Link href="/recruiter">Explore Recruiter Tools</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
