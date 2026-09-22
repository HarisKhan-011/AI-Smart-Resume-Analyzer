import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Reveal } from "@/components/landing/reveal"
import {
  Compass,
  FileSearch,
  Sparkles,
  Target,
  TrendingUp,
  Lightbulb,
  Users,
} from "lucide-react"

const features = [
  {
    icon: FileSearch,
    title: "Resume analysis",
    description: "Upload your resume and get structured insights about experience, education, and skills.",
  },
  {
    icon: Sparkles,
    title: "Skill extraction",
    description: "Identify technical and soft skills from your resume and a pasted job description.",
  },
  {
    icon: Target,
    title: "Job matching",
    description: "Compare your profile against role requirements and see a compatibility score.",
  },
  {
    icon: TrendingUp,
    title: "Skill-gap analysis",
    description: "Discover which skills you still need for a target role.",
  },
  {
    icon: Compass,
    title: "Industry insights",
    description: "See how your resume skills map to a target industry, outlook, and typical roles.",
  },
  {
    icon: Lightbulb,
    title: "Resume improvement",
    description: "Get grounded rewrites of summary, experience, and skills without inventing facts.",
  },
  {
    icon: Users,
    title: "Candidate ranking",
    description: "Recruiters can rank and compare candidates based on job-fit metrics.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="container mx-auto px-4 py-20 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Product</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Built for analysis, not browsing</h2>
        <p className="mt-4 text-muted-foreground">
          Everything you need to understand a resume and match it to a target role.
        </p>
      </Reveal>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Reveal key={feature.title} delay={index * 70}>
              <Card className="group hover-lift h-full border-border/80">
                <CardHeader>
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
