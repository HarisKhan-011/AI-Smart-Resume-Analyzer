"use client"

import { useEffect, useState } from "react"
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
      <FeaturePlaceholder
        title="Profile"
        description="Your account details from the current session."
        icon={User}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
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
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" placeholder="Software Developer" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" placeholder="Tell us about yourself..." rows={4} disabled />
              </div>
              <Button type="submit" disabled>
                Save Changes
              </Button>
              <p className="text-xs text-muted-foreground">
                Profile editing will be connected in a later phase. Password hashes are never returned by the API.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
