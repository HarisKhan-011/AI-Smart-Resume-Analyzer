"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogoutButton } from "@/components/auth/logout-button"
import { BrandMark } from "@/components/brand/brand-mark"
import type { UserRole } from "@/types/user"
import {
  Compass,
  LayoutDashboard,
  FileText,
  Search,
  Briefcase,
  TrendingUp,
  User,
  Settings,
  Users,
  BarChart3,
  Shield,
  MessageCircle,
  Wand2,
  GraduationCap,
  Route,
  PanelLeft,
  PanelLeftClose,
  LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  items: NavItem[]
}

export const candidateNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume", label: "My Resumes", icon: FileText },
  { href: "/job-match", label: "Job Match", icon: Search },
  { href: "/skill-gap", label: "Skill Gap", icon: TrendingUp },
  { href: "/industry-insights", label: "Industry Insights", icon: Compass },
  { href: "/career-roadmap", label: "Career Roadmap", icon: Route },
  { href: "/career-assistant", label: "Career Assistant", icon: MessageCircle },
  { href: "/resume-improve", label: "Resume Improve", icon: Wand2 },
  { href: "/interview-prep", label: "Interview Prep", icon: GraduationCap },
  { href: "/profile", label: "Profile", icon: User },
]

export const recruiterNavItems: NavItem[] = [
  { href: "/recruiter", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recruiter/jobs", label: "My Jobs", icon: Briefcase },
  { href: "/recruiter/jobs/new", label: "Post a Job", icon: Briefcase },
  { href: "/recruiter/candidates", label: "Candidates", icon: Users },
  { href: "/recruiter/rankings", label: "Candidate Rankings", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
]

export const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: Shield },
  { href: "/recruiter", label: "Recruiter Tools", icon: Briefcase },
  { href: "/dashboard", label: "Candidate View", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
]

const candidateNavGroups: NavGroup[] = [
  { label: "Overview", items: candidateNavItems.slice(0, 3) },
  { label: "Insights", items: candidateNavItems.slice(3, 6) },
  { label: "Improve", items: candidateNavItems.slice(6, 9) },
  { label: "Account", items: candidateNavItems.slice(9) },
]

const recruiterNavGroups: NavGroup[] = [
  { label: "Hiring", items: recruiterNavItems.slice(0, 5) },
  { label: "Account", items: recruiterNavItems.slice(5) },
]

const adminNavGroups: NavGroup[] = [
  { label: "Admin", items: adminNavItems.slice(0, 3) },
  { label: "Account", items: adminNavItems.slice(3) },
]

export function getNavItems(role: UserRole = "candidate"): NavItem[] {
  if (role === "admin") return adminNavItems
  if (role === "recruiter") return recruiterNavItems
  return candidateNavItems
}

function getNavGroups(role: UserRole = "candidate"): NavGroup[] {
  if (role === "admin") return adminNavGroups
  if (role === "recruiter") return recruiterNavGroups
  return candidateNavGroups
}

const exactMatchHrefs = new Set([
  "/dashboard",
  "/recruiter",
  "/admin",
  "/profile",
  "/settings",
  "/career-assistant",
  "/resume-improve",
  "/interview-prep",
  "/career-roadmap",
  "/industry-insights",
  "/recruiter/jobs/new",
])

function isActiveHref(pathname: string, href: string) {
  return exactMatchHrefs.has(href)
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)
}

function navLinkClass(isActive: boolean, collapsed: boolean) {
  return cn(
    "flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    collapsed ? "justify-center" : "gap-3",
    isActive
      ? "bg-primary/10 text-primary shadow-sm"
      : "text-muted-foreground hover:bg-background hover:text-foreground"
  )
}

interface NavLinksProps {
  items: NavItem[]
  onNavigate?: () => void
  collapsed?: boolean
}

export function NavLinks({ items, onNavigate, collapsed = false }: NavLinksProps) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = isActiveHref(pathname, item.href)

        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            onClick={onNavigate}
            className={navLinkClass(isActive, collapsed)}
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

interface NavGroupsProps {
  groups: NavGroup[]
  onNavigate?: () => void
  collapsed?: boolean
}

function NavGroups({ groups, onNavigate, collapsed = false }: NavGroupsProps) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Main navigation">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          {!collapsed && (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const Icon = item.icon
            const isActive = isActiveHref(pathname, item.href)
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={onNavigate}
                className={navLinkClass(isActive, collapsed)}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

interface SidebarFooterProps {
  onNavigate?: () => void
  collapsed?: boolean
}

export function SidebarFooter({ onNavigate, collapsed = false }: SidebarFooterProps) {
  const pathname = usePathname()
  const settingsActive = pathname === "/settings"

  return (
    <div className="border-t border-border/80 p-3">
      <Link
        href="/settings"
        onClick={onNavigate}
        className={navLinkClass(settingsActive, collapsed)}
        aria-current={settingsActive ? "page" : undefined}
        title={collapsed ? "Settings" : undefined}
      >
        <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
        {!collapsed && <span>Settings</span>}
      </Link>
      <LogoutButton collapsed={collapsed} onClick={onNavigate} className="mt-1" />
    </div>
  )
}

interface SidebarProps {
  role?: UserRole
  collapsed?: boolean
  onNavigate?: () => void
  onToggle?: () => void
}

export function Sidebar({
  role = "candidate",
  collapsed = false,
  onNavigate,
  onToggle,
}: SidebarProps) {
  const navGroups = getNavGroups(role)
  const label =
    role === "admin"
      ? "Admin navigation"
      : role === "recruiter"
        ? "Recruiter navigation"
        : "Candidate navigation"

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border/80 bg-muted/40 transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
      aria-label={label}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border/80",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        <Link
          href="/"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark compact iconOnly={collapsed} />
        </Link>
        {onToggle && !collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <NavGroups groups={navGroups} onNavigate={onNavigate} collapsed={collapsed} />
      <SidebarFooter onNavigate={onNavigate} collapsed={collapsed} />
      {onToggle && collapsed && (
        <div className="border-t border-border/80 p-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-center rounded-xl p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <PanelLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </aside>
  )
}
