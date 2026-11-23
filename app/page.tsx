import { LandingNavbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero"
import { TrustSection } from "@/components/landing/trust-section"
import { FeaturesSection } from "@/components/landing/features"
import { HowItWorksSection } from "@/components/landing/how-it-works"
import { ForCandidatesSection } from "@/components/landing/for-candidates"
import { CtaSection } from "@/components/landing/cta-section"
import { LandingFooter } from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <LandingNavbar />
      <main className="flex-1 pt-[4.25rem]">
        <HeroSection />
        <TrustSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ForCandidatesSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
