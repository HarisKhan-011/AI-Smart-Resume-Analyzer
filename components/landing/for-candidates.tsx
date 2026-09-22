import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/landing/reveal"
import { CheckCircle2 } from "lucide-react"

const candidatePoints = [
  "Upload resume",
  "Analyze skills and ATS score",
  "Match against a job description",
  "Find missing skills",
  "Improve resume and interview prep",
]

export function ForCandidatesSection() {
  return (
    <section id="for-candidates" className="container mx-auto px-4 py-20 sm:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Candidates</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Know your resume before you apply</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Take control with AI analysis and honest role matching grounded in your file.
          </p>
          <ul className="mt-8 space-y-3">
            {candidatePoints.map((point, index) => (
              <li
                key={point}
                className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5 transition-colors hover:bg-muted"
                style={{ transitionDelay: `${index * 40}ms` }}
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">{point}</span>
              </li>
            ))}
          </ul>
          <Button className="mt-8" size="lg" asChild>
            <Link href="/resume/upload">Start analyzing</Link>
          </Button>
        </Reveal>
        <Reveal delay={120} className="rounded-3xl border bg-gradient-to-br from-primary/5 to-background p-6 shadow-card sm:p-8">
          <div className="space-y-3">
            {[
              { label: "Resume score", value: "ATS-ready" },
              { label: "Skills found", value: "From your CV" },
              { label: "Role match", value: "Against a JD" },
            ].map((item) => (
              <div key={item.label} className="hover-lift rounded-2xl border bg-background p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{item.value}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
