"use client"

import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"

interface DashboardLayoutProps {
  children: React.ReactNode
  role?: 'candidate' | 'recruiter'
}

export function DashboardLayout({ children, role = 'candidate' }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-muted/10 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
