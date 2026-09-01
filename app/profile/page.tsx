"use client"

import { useEffect, useState } from "react"
import { User } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { getRoleLabel } from "@/lib/auth-paths"
import type { PublicUser } from "@/types/user"

export default function ProfilePage() {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        const response = await fetch("/api/users/me")
        const data = (await response.json()) as { user?: PublicUser; error?: string }
        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load profile")
        }
        if (!cancelled) {
          setUser(data.user ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load profile")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Account details from your current session."
        icon={User}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile information</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load profile</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={user?.name ?? ""} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email ?? ""} readOnly />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={getRoleLabel(user?.role)} readOnly />
              </div>
              <p className="text-xs text-muted-foreground">
                Profile fields are read-only. Password hashes are never returned by the API.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
