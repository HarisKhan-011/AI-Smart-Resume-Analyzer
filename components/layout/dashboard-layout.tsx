"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { MobileNavigation } from "./mobile-navigation"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  showSearch?: boolean
}

function DashboardShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden w-64 border-r bg-background p-4 lg:block">
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
  const { data: session, status } = useSession()
  const role = session?.user?.role ?? "candidate"

  if (status === "loading") {
    return <DashboardShellSkeleton />
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar role={role} />
      </div>

      <div className="hidden md:block lg:hidden">
        <Sidebar role={role} collapsed />
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
          showSearch={showSearch}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
