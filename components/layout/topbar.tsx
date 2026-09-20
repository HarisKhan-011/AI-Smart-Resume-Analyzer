"use client"

import { usePathname } from "next/navigation"
import { UserMenu } from "./user-menu"
import { MobileMenuButton } from "./mobile-navigation"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/resume": "My Resumes",
  "/resume/upload": "Upload Resume",
  "/resume/analysis": "Resume Analysis",
  "/job-match": "Job Match",
  "/skill-gap": "Skill Gap",
  "/career-assistant": "Career Assistant",
  "/resume-improve": "Resume Improve",
  "/interview-prep": "Interview Prep",
  "/career-roadmap": "Career Roadmap",
  "/profile": "Profile",
  "/recruiter": "Recruiter Dashboard",
  "/recruiter/jobs": "My Jobs",
  "/recruiter/jobs/new": "Post a Job",
  "/recruiter/candidates": "Candidates",
  "/recruiter/rankings": "Candidate Rankings",
  "/settings": "Settings",
  "/admin": "Admin Dashboard",
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith("/resume/")) return "Resume"
  if (pathname.startsWith("/jobs/")) return "Role details"
  if (pathname.startsWith("/recruiter/candidates/")) return "Candidate"
  if (pathname.startsWith("/recruiter/jobs/") && pathname.endsWith("/edit")) return "Edit Job"
  return "Dashboard"
}

interface TopbarProps {
  title?: string
  onMenuClick?: () => void
  showSearch?: boolean
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const pathname = usePathname()
  const displayTitle = title ?? getPageTitle(pathname)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 overflow-visible border-b bg-background px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && <MobileMenuButton onClick={onMenuClick} />}
        <h1 className="truncate text-lg font-semibold sm:text-xl">{displayTitle}</h1>
      </div>
      <UserMenu />
    </header>
  )
}
