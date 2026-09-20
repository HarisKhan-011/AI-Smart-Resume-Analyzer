import Link from "next/link"

const productLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#for-candidates", label: "For candidates" },
  { href: "/#for-recruiters", label: "For recruiters" },
]

const accountLinks = [
  { href: "/login", label: "Login" },
  { href: "/register", label: "Create account" },
  { href: "/resume/upload", label: "Analyze a resume" },
  { href: "/job-match", label: "Match a role" },
]

export function LandingFooter({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <footer className="shrink-0 border-t bg-background">
        <div className="container mx-auto flex h-12 items-center justify-between px-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} ResumeAI</span>
          <span>Smart resume analysis</span>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">R</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">ResumeAI</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              A focused resume analyzer and job matcher. Upload a CV, score ATS readiness,
              and compare it with a target role description.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Product</p>
            <ul className="mt-4 space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Account</p>
            <ul className="mt-4 space-y-2.5">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ResumeAI. All rights reserved.</p>
          <p>Resume analysis and role matching only — no job board.</p>
        </div>
      </div>
    </footer>
  )
}
