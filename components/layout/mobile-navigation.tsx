"use client"

import { Menu, X } from "lucide-react"
import { Sidebar } from "./sidebar"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/user"

interface MobileNavigationProps {
  open: boolean
  onClose: () => void
  role?: UserRole
}

export function MobileNavigation({ open, onClose, role = "candidate" }: MobileNavigationProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="relative h-full">
          <button
            onClick={onClose}
            className="absolute right-3 top-4 z-10 rounded-md p-1 text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
          <Sidebar role={role} onNavigate={onClose} />
        </div>
      </div>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md p-2 text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      aria-label="Open navigation menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
