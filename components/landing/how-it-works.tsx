import { FileText, ScanSearch, GitCompare, Sparkles } from "lucide-react"
import { Reveal } from "@/components/landing/reveal"

const steps = [
  {
    step: "01",
    title: "Upload your resume",
    description: "Add a PDF or DOCX. We keep the original file and extract only what is written there.",
    icon: FileText,
  },
  {
    step: "02",
    title: "Let AI analyze it",
    description: "Skills, experience, and an ATS-oriented score come from your resume text — not invented details.",
    icon: ScanSearch,
  },
  {
    step: "03",
    title: "Match a target role",
    description: "Paste a job description to see coverage, matched skills, and honest gaps against that role.",
    icon: GitCompare,
  },
  {
    step: "04",
    title: "Improve with a plan",
    description: "Use skill-gap notes, resume rewrites, interview prep, and a roadmap grounded in your data.",
    icon: Sparkles,
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-y bg-muted/50 py-20 sm:py-24">
      <div className="container mx-auto px-4">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Process</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-4 text-muted-foreground">
            Four steps from a resume file to a role-ready analysis. You bring the job description;
            we do not list, search, or recommend openings.
          </p>
        </Reveal>
        <ol className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((item, index) => {
            const Icon = item.icon
            return (
              <li key={item.step}>
                <Reveal delay={index * 90}>
                  <div className="hover-lift relative h-full rounded-2xl border bg-background p-6 shadow-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">{item.step}</span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                </Reveal>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
