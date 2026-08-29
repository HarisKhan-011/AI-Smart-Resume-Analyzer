"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Briefcase, 
  TrendingUp, 
  ClipboardList, 
  User, 
  Settings, 
  LogOut,
  Users,
  Building2 
} from "lucide-react"

interface SidebarProps {
  role?: 'candidate' | 'recruiter'
}

export function Sidebar({ role = 'candidate' }: SidebarProps) {
  const pathname = usePathname()

  const candidateNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/resume/upload", label: "My Resumes", icon: FileText },
    { href: "/job-match", label: "Check Job Match", icon: Search },
    { href: "/recommendations", label: "Recommended Jobs", icon: Briefcase },
    { href: "/skill-gap", label: "Skill Gap", icon: TrendingUp },
    { href: "/applications", label: "Applications", icon: ClipboardList },
    { href: "/profile", label: "Profile", icon: User },
  ]

  const recruiterNav = [
    { href: "/recruiter", label: "Dashboard", icon: LayoutDashboard },
    { href: "/recruiter/jobs", label: "My Jobs", icon: Briefcase },
    { href: "/recruiter/candidates", label: "Candidates", icon: Users },
    { href: "/recruiter/rankings", label: "Candidate Rankings", icon: Building2 },
    { href: "/profile", label: "Profile", icon: User },
  ]

  const navItems = role === 'candidate' ? candidateNav : recruiterNav

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">R</span>
          </div>
          <span className="text-lg font-semibold">ResumeAI</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/settings"
          className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
        <button
          className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
