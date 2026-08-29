import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Brain, Briefcase, ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-16 sm:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="animate-fade-in">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            AI-Powered Resume Analysis
            <span className="block text-primary">& Smart Job Matching</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            Analyze your resume, discover your skills, compare yourself with job
            descriptions, identify skill gaps, and find relevant job opportunities.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/resume/upload">Analyze My Resume</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/jobs">Explore Jobs</Link>
            </Button>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="flex items-center justify-center gap-4">
            <Card className="w-40 shadow-lg">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <FileText className="h-10 w-10 text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium">Resume</p>
              </CardContent>
            </Card>
            <ArrowRight className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <Card className="w-40 shadow-lg border-primary/20">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <Brain className="h-10 w-10 text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium">AI Analysis</p>
              </CardContent>
            </Card>
            <ArrowRight className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <Card className="w-40 shadow-lg">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <Briefcase className="h-10 w-10 text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium">Job Matching</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
