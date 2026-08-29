import Link from "next/link"

export function LandingFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">R</span>
              </div>
              <span className="text-lg font-semibold">ResumeAI</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              AI-Powered Smart Resume Analyzer & Job Matcher
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#features" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">For Users</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#for-candidates" className="hover:text-foreground transition-colors">For Candidates</Link></li>
              <li><Link href="/#for-recruiters" className="hover:text-foreground transition-colors">For Recruiters</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">About</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/register" className="hover:text-foreground transition-colors">Get Started</Link></li>
              <li><Link href="/login" className="hover:text-foreground transition-colors">Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ResumeAI. Final Year Project.
        </div>
      </div>
    </footer>
  )
}
