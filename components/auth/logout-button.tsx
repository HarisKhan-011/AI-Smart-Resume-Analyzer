"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoutButtonProps {
  collapsed?: boolean
  className?: string
  onClick?: () => void
}

export function LogoutButton({ collapsed = false, className, onClick }: LogoutButtonProps) {
  async function handleLogout() {
    onClick?.()
    try {
      await signOut({ callbackUrl: "/login" })
    } catch {
      window.location.href = "/login"
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        "flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed ? "justify-center" : "gap-3",
        className
      )}
      title={collapsed ? "Logout" : undefined}
    >
      <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span>Logout</span>}
    </button>
  )
}
