const steps = [
  { step: "01", title: "Upload Resume", description: "Upload your PDF or Word resume to get started." },
  { step: "02", title: "AI Analyzes Resume", description: "Our system extracts skills, experience, and education." },
  { step: "03", title: "Compare With Jobs", description: "Match your profile against available job descriptions." },
  { step: "04", title: "Discover Skill Gaps", description: "See which skills you need to improve or learn." },
  { step: "05", title: "Get Recommendations", description: "Receive personalized job and skill recommendations." },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
          <p className="mt-4 text-muted-foreground">
            A simple five-step process to better job matches.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((item, index) => (
            <div key={item.step} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {item.step}
              </div>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-7 hidden h-0.5 w-full translate-x-1/2 bg-border lg:block" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
