import type { UserRole } from "@/types/user"

export const AUTH_PAGES = ["/login", "/register"] as const

export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/resume",
  "/job-match",
  "/jobs",
  "/recommendations",
  "/skill-gap",
  "/applications",
  "/career-assistant",
  "/resume-improve",
  "/interview-prep",
  "/profile",
  "/settings",
  "/recruiter",
  "/admin",
] as const

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`))
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isRecruiterPath(pathname: string): boolean {
  return pathname === "/recruiter" || pathname.startsWith("/recruiter/")
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/")
}

export function getPostLoginPath(role?: UserRole | string | null): string {
  if (role === "admin") return "/admin"
  if (role === "recruiter") return "/recruiter"
  return "/dashboard"
}

export function getRoleLabel(role?: UserRole | string | null): string {
  if (role === "admin") return "Admin"
  if (role === "recruiter") return "Recruiter"
  return "Candidate"
}

export function canAccessRecruiterRoutes(role?: UserRole | string | null): boolean {
  return role === "recruiter" || role === "admin"
}

export function canAccessAdminRoutes(role?: UserRole | string | null): boolean {
  return role === "admin"
}
