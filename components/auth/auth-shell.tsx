import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LandingNavbar } from "@/components/landing/navbar"
import { LandingFooter } from "@/components/landing/footer"

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none bg-background">
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl"
        aria-hidden="true"
      />
      <LandingNavbar compact />
      <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-4">
        <Card className="w-full max-w-md border-border/80 shadow-lift">
          <CardHeader className="space-y-2 pb-3 pt-5 text-center">
            <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-5">{children}</CardContent>
        </Card>
      </main>
      <LandingFooter compact />
    </div>
  )
}
