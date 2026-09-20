import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
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
    title: "Resume Analysis",
    description: "Upload your resume and get structured insights about your experience, education, and skills.",
  },
  {
    icon: Sparkles,
    title: "Skill Extraction",
    description: "Automatically identify technical and soft skills from your resume and job descriptions.",
  },
  {
    icon: Target,
    title: "Job Matching",
    description: "Compare your profile against job requirements and see your compatibility score.",
  },
  {
    icon: TrendingUp,
    title: "Skill Gap Analysis",
    description: "Discover which skills you need to develop to qualify for your target roles.",
  },
  {
    icon: Lightbulb,
    title: "Resume Improvement",
    description: "Get grounded rewrites of summary, experience, and skills without inventing facts.",
  },
  {
    icon: Users,
    title: "Candidate Ranking",
    description: "Recruiters can rank and compare candidates based on job fit metrics.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="container mx-auto px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Features</h2>
        <p className="mt-4 text-muted-foreground">
          Everything you need to analyze a resume and match it to a target role.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.title} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
