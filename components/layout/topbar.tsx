"use client"

import { usePathname } from "next/navigation"
import { useRef, useState } from "react"
import { Search } from "lucide-react"
import { KeywordSuggestInput } from "@/components/jobs/keyword-suggest-input"
import { UserMenu } from "./user-menu"
import { MobileMenuButton } from "./mobile-navigation"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/resume": "My Resumes",
  "/resume/upload": "Upload Resume",
  "/resume/analysis": "Resume Analysis",
  "/job-match": "Job Match",
  "/recommendations": "Recommended Jobs",
  "/skill-gap": "Skill Gap",
  "/applications": "Applications",
  "/profile": "Profile",
  "/jobs": "Jobs",
  "/recruiter": "Recruiter Dashboard",
  "/recruiter/jobs": "My Jobs",
  "/recruiter/jobs/new": "Post a Job",
  "/recruiter/candidates": "Candidates",
  "/recruiter/rankings": "Candidate Rankings",
  "/settings": "Settings",
  "/admin": "Admin Dashboard",
}

function TopbarJobSearch() {
  const [keyword, setKeyword] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action="/jobs" method="GET" className="relative hidden md:block">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <KeywordSuggestInput
        name="keyword"
        value={keyword}
        onChange={setKeyword}
        onPick={() => formRef.current?.requestSubmit()}
        placeholder="Search jobs..."
        className="w-40 pl-10 lg:w-64"
        ariaLabel="Search jobs"
      />
      <input type="hidden" name="location" value="Pakistan" />
    </form>
  )
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith("/resume/")) return "Resume"
  if (pathname.startsWith("/jobs/")) return "Job Details"
  if (pathname.startsWith("/recruiter/candidates/")) return "Candidate"
  if (pathname.startsWith("/recruiter/jobs/") && pathname.endsWith("/edit")) return "Edit Job"
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
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 overflow-visible border-b bg-background px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && <MobileMenuButton onClick={onMenuClick} />}
        <h1 className="truncate text-lg font-semibold sm:text-xl">{displayTitle}</h1>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        {showSearch && <TopbarJobSearch />}

        <UserMenu />
      </div>
    </header>
  )
}
