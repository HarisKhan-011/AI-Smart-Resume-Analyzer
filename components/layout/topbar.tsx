"use client"

import { usePathname } from "next/navigation"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserMenu } from "./user-menu"
import { MobileMenuButton } from "./mobile-navigation"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/resume": "My Resumes",
  "/resume/upload": "Upload Resume",
  "/resume/analysis": "Resume Analysis",
  "/job-match": "Check Job Match",
  "/recommendations": "Recommended Jobs",
  "/skill-gap": "Skill Gap",
  "/applications": "Applications",
  "/profile": "Profile",
  "/jobs": "Jobs",
  "/recruiter": "Recruiter Dashboard",
  "/recruiter/jobs": "My Jobs",
  "/recruiter/candidates": "Candidates",
  "/recruiter/rankings": "Candidate Rankings",
  "/settings": "Settings",
  "/admin": "Admin Dashboard",
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith("/resume/")) return "Resume"
  if (pathname.startsWith("/jobs/")) return "Job Details"
  return "Dashboard"
}

interface TopbarProps {
  title?: string
  onMenuClick?: () => void
  showSearch?: boolean
}

export function Topbar({ title, onMenuClick, showSearch = true }: TopbarProps) {
  const pathname = usePathname()
  const displayTitle = title ?? getPageTitle(pathname)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && <MobileMenuButton onClick={onMenuClick} />}
        <h1 className="truncate text-lg font-semibold sm:text-xl">{displayTitle}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {showSearch && (
          <div className="relative hidden md:block">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search..."
              className="w-48 pl-10 lg:w-64"
              aria-label="Search"
            />
          </div>
        )}

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        <UserMenu />
      </div>
    </header>
  )
}
