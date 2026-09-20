"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { Loader2, Settings, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const name = session?.user?.name?.trim() || "Your account"

  async function onDelete() {
    setIsDeleting(true)
    setError(null)
    try {
      const response = await fetch("/api/users/me", { method: "DELETE" })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? "Unable to delete account.")
      await signOut({ callbackUrl: "/" })
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete account.")
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="View your account name or delete this profile." icon={Settings} />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Settings error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Name</Label>
            <Input
              id="settings-name"
              value={status === "loading" ? "Loading..." : name}
              readOnly
            />
          </div>
          <div className="space-y-3 border-t pt-5">
            <p className="text-sm font-medium text-destructive">Delete profile</p>
            <p className="text-sm text-muted-foreground">
              This permanently deletes your account, uploaded resumes, matches, and chat history. This cannot be undone.
            </p>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
              <Input
                id="confirm-delete"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="DELETE"
                disabled={isDeleting}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              disabled={confirm !== "DELETE" || isDeleting}
              onClick={() => void onDelete()}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" />}
              {isDeleting ? "Deleting..." : "Delete my profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
