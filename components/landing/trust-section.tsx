import { Card, CardContent } from "@/components/ui/card"
import { Brain, Search, TrendingUp, Briefcase } from "lucide-react"

const values = [
  { icon: Brain, title: "AI Resume Analysis", description: "Intelligent parsing and skill extraction from your resume" },
  { icon: Search, title: "Smart Job Matching", description: "Compare your profile against job descriptions automatically" },
  { icon: TrendingUp, title: "Skill Gap Detection", description: "Identify missing skills and areas for improvement" },
  { icon: Briefcase, title: "Career Tools", description: "Improve your resume, close skill gaps, and prepare for interviews" },
]

export function TrustSection() {
  return (
    <section className="border-y bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="border-none bg-background shadow-sm">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
