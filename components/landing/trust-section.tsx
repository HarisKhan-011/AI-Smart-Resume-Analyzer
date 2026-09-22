import { Brain, Compass, Search, TrendingUp } from "lucide-react"
import { Reveal } from "@/components/landing/reveal"

const values = [
  { icon: Brain, title: "AI resume analysis", description: "Parse the file you uploaded — not a guessed profile." },
  { icon: Search, title: "Honest role matching", description: "Compare your skills with a job description you paste." },
  { icon: TrendingUp, title: "Skill-gap signals", description: "See missing skills before you rewrite or apply." },
  { icon: Compass, title: "Industry context", description: "Map those skills to a target industry and typical roles." },
]

export function TrustSection() {
  return (
    <section className="border-y bg-background/80 py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((item, index) => {
            const Icon = item.icon
            return (
              <Reveal key={item.title} delay={index * 80} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
