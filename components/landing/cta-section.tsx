import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="container mx-auto px-4 py-16 sm:py-24">
      <div className="rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground sm:px-16 sm:py-16">
        <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
          Build a stronger resume with clearer role matches.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
          Start by analyzing your resume, then compare it with a target job description.
        </p>
        <Button size="lg" variant="secondary" className="mt-8" asChild>
          <Link href="/register">Get Started</Link>
        </Button>
      </div>
    </section>
  )
}
