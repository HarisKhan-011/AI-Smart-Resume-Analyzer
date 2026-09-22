import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Brain, FileText, Sparkles } from "lucide-react"

const steps = [
  { icon: FileText, label: "Upload", copy: "PDF or DOCX" },
  { icon: Brain, label: "Analyze", copy: "Skills and ATS" },
  { icon: Sparkles, label: "Match", copy: "Against a role" },
]

export function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-60" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-orb-drift"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-indigo-200/50 blur-3xl animate-orb-drift [animation-delay:1.6s]"
        aria-hidden="true"
      />

      <div className="container relative mx-auto px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="animate-hero-in inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Resume analyzer & role matcher
          </p>
          <h1 className="animate-hero-in mt-6 text-4xl font-semibold tracking-tight [animation-delay:90ms] sm:text-5xl lg:text-6xl">
            See what your resume actually says —
            <span className="mt-1 block bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              then match it to a role.
            </span>
          </h1>
          <p className="animate-hero-in mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground [animation-delay:180ms] sm:text-xl">
            Upload a CV, extract skills, score ATS readiness, and compare it with a job description.
            No job board. No invented experience.
          </p>
          <div className="animate-hero-in mt-9 flex flex-col items-center justify-center gap-3 [animation-delay:260ms] sm:flex-row">
            <Button size="lg" className="group" asChild>
              <Link href="/resume/upload">
                Analyze my resume
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/job-match">Match a role</Link>
            </Button>
          </div>
        </div>

        <div className="animate-hero-in mx-auto mt-16 max-w-3xl [animation-delay:360ms]">
          <div className="animate-float rounded-3xl border bg-background/90 p-5 shadow-lift backdrop-blur sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Analysis snapshot</p>
                <p className="text-xs text-muted-foreground">Scores and skills come from the file you upload</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                From your CV
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>ATS readiness</span>
                <span className="text-muted-foreground">Scored after upload</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500 animate-meter-fill [--meter:74%]" />
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {steps.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-2xl border bg-muted/40 p-4 text-left">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <p className="mt-3 text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.copy}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
