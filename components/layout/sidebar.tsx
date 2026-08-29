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
  BarChart3,
  LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const candidateNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume/upload", label: "My Resumes", icon: FileText },
  { href: "/job-match", label: "Check Job Match", icon: Search },
  { href: "/recommendations", label: "Recommended Jobs", icon: Briefcase },
  { href: "/skill-gap", label: "Skill Gap", icon: TrendingUp },
  { href: "/applications", label: "Applications", icon: ClipboardList },
  { href: "/profile", label: "Profile", icon: User },
]

export const recruiterNavItems: NavItem[] = [
  { href: "/recruiter", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recruiter/jobs", label: "My Jobs", icon: Briefcase },
  { href: "/recruiter/candidates", label: "Candidates", icon: Users },
  { href: "/recruiter/rankings", label: "Candidate Rankings", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
]

interface NavLinksProps {
  items: NavItem[]
  onNavigate?: () => void
  collapsed?: boolean
}

export function NavLinks({ items, onNavigate, collapsed = false }: NavLinksProps) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 p-4" aria-label="Main navigation">
      {items.map((item) => {
        const Icon = item.icon
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" &&
            item.href !== "/recruiter" &&
            pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              collapsed ? "justify-center" : "space-x-3",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
            title={collapsed ? item.label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

interface SidebarFooterProps {
  onNavigate?: () => void
  collapsed?: boolean
}

export function SidebarFooter({ onNavigate, collapsed = false }: SidebarFooterProps) {
  return (
    <div className="border-t p-4">
      <Link
        href="/settings"
        onClick={onNavigate}
        className={cn(
          "flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          collapsed ? "justify-center" : "space-x-3"
        )}
        title={collapsed ? "Settings" : undefined}
      >
        <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
        {!collapsed && <span>Settings</span>}
      </Link>
      <Link
        href="/login"
        onClick={onNavigate}
        className={cn(
          "mt-1 flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          collapsed ? "justify-center" : "space-x-3"
        )}
        title={collapsed ? "Logout" : undefined}
      >
        <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
        {!collapsed && <span>Logout</span>}
      </Link>
    </div>
  )
}

interface SidebarProps {
  role?: "candidate" | "recruiter"
  collapsed?: boolean
  onNavigate?: () => void
}

export function Sidebar({ role = "candidate", collapsed = false, onNavigate }: SidebarProps) {
  const navItems = role === "candidate" ? candidateNavItems : recruiterNavItems

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
      aria-label={role === "candidate" ? "Candidate navigation" : "Recruiter navigation"}
    >
      <div className={cn("flex h-16 items-center border-b", collapsed ? "justify-center px-2" : "px-6")}>
        <Link href="/" className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">R</span>
          </div>
          {!collapsed && <span className="text-lg font-semibold">ResumeAI</span>}
        </Link>
      </div>
      <NavLinks items={navItems} onNavigate={onNavigate} collapsed={collapsed} />
      <SidebarFooter onNavigate={onNavigate} collapsed={collapsed} />
    </aside>
  )
}
