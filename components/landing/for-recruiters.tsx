import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/landing/reveal"
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
    <section id="for-recruiters" className="border-y bg-muted/50 py-20 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal delay={80} className="order-2 rounded-3xl border bg-background p-6 shadow-card sm:p-8 lg:order-1">
            <div className="space-y-3">
              {[
                { label: "Active jobs", value: "Your postings" },
                { label: "Candidates", value: "Ranked by fit" },
                { label: "Top match", value: "Skill overlap" },
              ].map((item) => (
                <div key={item.label} className="hover-lift rounded-2xl bg-muted/70 p-5">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">{item.value}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Recruiters</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Rank candidates with clearer fit</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Streamline hiring with resume analysis and ranking — without a public job marketplace.
            </p>
            <ul className="mt-8 space-y-3">
              {recruiterPoints.map((point) => (
                <li key={point} className="flex items-center gap-3 rounded-xl bg-background px-3 py-2.5 shadow-sm transition-colors hover:bg-muted/60">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium">{point}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-8" size="lg" asChild>
              <Link href="/recruiter">Explore recruiter tools</Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
