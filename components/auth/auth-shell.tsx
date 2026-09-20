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
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none bg-background">
      <LandingNavbar compact />
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-4">
        <Card className="w-full max-w-md border-muted shadow-sm">
          <CardHeader className="space-y-2 pb-3 pt-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">R</span>
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-5">{children}</CardContent>
        </Card>
      </main>
      <LandingFooter compact />
    </div>
  )
}
