import { FileText, ScanSearch, GitCompare, Sparkles } from "lucide-react"

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
    <section id="how-it-works" className="border-y bg-muted/30 py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Process</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-4 text-muted-foreground">
            Four steps from a resume file to a role-ready analysis. You bring the job description;
            we do not list, search, or recommend openings.
          </p>
        </div>
        <ol className="relative mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div
            className="pointer-events-none absolute left-[12%] right-[12%] top-9 hidden h-px bg-border xl:block"
            aria-hidden="true"
          />
          {steps.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.step} className="relative rounded-xl border bg-background p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">{item.step}</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border bg-background text-primary shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
