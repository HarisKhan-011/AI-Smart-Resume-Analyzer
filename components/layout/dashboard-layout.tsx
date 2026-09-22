"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { MobileNavigation } from "./mobile-navigation"
import { Skeleton } from "@/components/ui/skeleton"

const SIDEBAR_STORAGE_KEY = "resumeai-sidebar-collapsed"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  showSearch?: boolean
}

function DashboardShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden w-64 border-r border-border/80 bg-muted/40 p-4 lg:block">
        <Skeleton className="mb-8 h-8 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex-1 space-y-4 p-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}

export function DashboardLayout({
  children,
  title,
  showSearch = true,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { data: session, status } = useSession()
  const role = session?.user?.role ?? "candidate"

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1")
  }, [])

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0")
      return next
    })
  }

  if (status === "loading") {
    return <DashboardShellSkeleton />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:block">
        <Sidebar role={role} collapsed={collapsed} onToggle={toggleSidebar} />
      </div>

      <MobileNavigation
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        role={role}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
          onSidebarToggle={toggleSidebar}
          sidebarCollapsed={collapsed}
          showSearch={showSearch}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/40 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
