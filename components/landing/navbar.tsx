"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/auth/logout-button"
import { getPostLoginPath } from "@/lib/auth-paths"
import { Menu, X } from "lucide-react"
import { BrandMark } from "@/components/brand/brand-mark"
import { cn } from "@/lib/utils"

const SECTION_LINKS = [
  { id: "features", href: "/#features", label: "Features" },
  { id: "how-it-works", href: "/#how-it-works", label: "How It Works" },
  { id: "for-candidates", href: "/#for-candidates", label: "For Candidates" },
  { id: "for-recruiters", href: "/#for-recruiters", label: "For Recruiters" },
] as const

const SECTION_IDS = ["home", ...SECTION_LINKS.map((item) => item.id)] as const

function navClass(active: boolean) {
  return cn(
    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
  )
}

function sectionFromHash(hash: string): string {
  const id = hash.replace("#", "")
  return SECTION_IDS.includes(id as (typeof SECTION_IDS)[number]) ? id : "home"
}

export function LandingNavbar({ compact = false }: { compact?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("home")
  const lockedSection = useRef<string | null>(null)
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const dashboardHref = getPostLoginPath(session?.user?.role)
  const onHome = pathname === "/"

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!onHome) {
      setActiveSection("home")
      return
    }

    const applyHash = () => {
      setActiveSection(sectionFromHash(window.location.hash))
    }
    applyHash()
    window.addEventListener("hashchange", applyHash)

    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (node): node is HTMLElement => Boolean(node)
    )
    if (elements.length === 0) {
      return () => window.removeEventListener("hashchange", applyHash)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (lockedSection.current) {
          const locked = entries.find((entry) => entry.target.id === lockedSection.current && entry.isIntersecting)
          if (locked) lockedSection.current = null
          else return
        }
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id)
        }
      },
      { rootMargin: "-18% 0px -72% 0px", threshold: [0.1, 0.25, 0.5, 0.75] }
    )

    elements.forEach((el) => observer.observe(el))
    return () => {
      observer.disconnect()
      window.removeEventListener("hashchange", applyHash)
    }
  }, [onHome])

  function activateSection(id: string) {
    lockedSection.current = id
    setActiveSection(id)
    setMobileOpen(false)
  }

  const homeActive = onHome && activeSection === "home"

  return (
    <header
      className={cn(
        "sticky top-0 z-50 shrink-0 border-b backdrop-blur-xl transition-all duration-300",
        compact
          ? "border-border/70 bg-background/90"
          : scrolled
            ? "border-border/80 bg-background/90 shadow-sm"
            : "border-transparent bg-background/70"
      )}
    >
      <div className={cn("container mx-auto flex items-center justify-between px-4", compact ? "h-14" : "h-[4.25rem]")}>
        <Link
          href="/#home"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => activateSection("home")}
        >
          <BrandMark compact={compact} />
        </Link>

        {!compact && (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            <Link href="/#home" className={navClass(homeActive)} onClick={() => activateSection("home")}>
              Home
            </Link>
            {SECTION_LINKS.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={navClass(onHome && activeSection === link.id)}
                onClick={() => activateSection(link.id)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="hidden items-center gap-3 md:flex">
          {status === "loading" ? (
            <div className="h-9 w-28 animate-pulse rounded-full bg-muted" aria-hidden="true" />
          ) : session?.user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href={dashboardHref}>Dashboard</Link>
              </Button>
              <LogoutButton className="w-auto px-3" />
            </>
          ) : (
            <>
              <Button variant={pathname === "/login" ? "secondary" : "ghost"} asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="rounded-full p-2 text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t px-4 py-4 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-2">
            {!compact && (
              <>
                <Link
                  href="/#home"
                  className={cn("rounded-xl px-3 py-2 text-sm font-medium hover:bg-accent", homeActive && "bg-primary/10 text-primary")}
                  onClick={() => activateSection("home")}
                >
                  Home
                </Link>
                {SECTION_LINKS.map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm font-medium hover:bg-accent",
                      onHome && activeSection === link.id ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}
                    onClick={() => activateSection(link.id)}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
            <div className={cn("flex flex-col gap-2", !compact && "mt-2 border-t pt-4")}>
              {session?.user ? (
                <>
                  <Button asChild>
                    <Link href={dashboardHref} onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <LogoutButton onClick={() => setMobileOpen(false)} />
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
