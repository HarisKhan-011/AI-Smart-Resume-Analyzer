import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/landing/reveal"

export function CtaSection() {
  return (
    <section className="container mx-auto px-4 py-20 sm:py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-indigo-600 to-indigo-800 px-8 py-14 text-center text-primary-foreground shadow-lift sm:px-16 sm:py-20">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl animate-orb-drift"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-8 h-44 w-44 rounded-full bg-indigo-300/20 blur-2xl animate-orb-drift [animation-delay:2s]"
            aria-hidden="true"
          />
          <h2 className="relative text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Build a stronger resume with clearer role matches.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Start by analyzing your resume, then compare it with a target job description.
          </p>
          <Button size="lg" variant="secondary" className="relative mt-8" asChild>
            <Link href="/register">Create a free account</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  )
}
