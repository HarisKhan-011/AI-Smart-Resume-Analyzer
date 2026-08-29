"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { MobileNavigation } from "./mobile-navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
  role?: "candidate" | "recruiter"
  title?: string
  showSearch?: boolean
}

export function DashboardLayout({
  children,
  role = "candidate",
  title,
  showSearch = true,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Full sidebar — desktop */}
      <div className="hidden lg:block">
        <Sidebar role={role} />
      </div>

      {/* Collapsed sidebar — tablet */}
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
          role={role}
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
