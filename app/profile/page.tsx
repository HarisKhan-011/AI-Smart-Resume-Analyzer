"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Loader2, User } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { getRoleLabel } from "@/lib/auth-paths"
import { getInitials } from "@/lib/utils"
import type { PublicUser } from "@/types/user"

const MAX_IMAGE_CHARS = 350_000

type ProfilePayload = PublicUser & {
  phone?: string
  title?: string
  location?: string
  bio?: string
}

export default function ProfilePage() {
  const { update } = useSession()
  const [user, setUser] = useState<ProfilePayload | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [bio, setBio] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        const response = await fetch("/api/users/me")
        const data = (await response.json()) as { user?: ProfilePayload; error?: string }
        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load profile")
        }
        if (!cancelled && data.user) {
          setUser(data.user)
          setName(data.user.name ?? "")
          setPhone(data.user.phone ?? "")
          setTitle(data.user.title ?? "")
          setLocation(data.user.location ?? "")
          setBio(data.user.bio ?? "")
          setImage(data.user.image ?? null)
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

  function onPickPhoto(file: File | undefined) {
    setError(null)
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Choose a JPG, PNG, or WebP image.")
      return
    }
    if (file.size > 250_000) {
      setError("Profile photo must be 250 KB or smaller.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      if (result.length > MAX_IMAGE_CHARS) {
        setError("Profile photo is too large after encoding. Choose a smaller image.")
        return
      }
      setImage(result)
    }
    reader.readAsDataURL(file)
  }

  async function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, title, location, bio, image }),
      })
      const data = (await response.json()) as {
        user?: ProfilePayload
        error?: string
        fieldErrors?: Record<string, string[]>
      }
      if (!response.ok) {
        throw new Error(data.error ?? data.fieldErrors?.name?.[0] ?? "Unable to update profile.")
      }
      if (data.user) {
        setUser(data.user)
        await update({ name: data.user.name, image: data.user.image })
      }
      setSuccess("Profile saved.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update profile.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Edit your account details, phone number, and photo."
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
          ) : (
            <form className="space-y-4" onSubmit={onSave}>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to save</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertTitle>Saved</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <div className="flex items-center gap-4">
                <Avatar
                  src={image ?? undefined}
                  alt={name}
                  fallback={getInitials(name)}
                  className="h-16 w-16"
                />
                <div className="space-y-2">
                  <Label htmlFor="photo">Profile photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => onPickPhoto(event.target.files?.[0])}
                    disabled={isSaving}
                  />
                  {image && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setImage(null)}>
                      Remove photo
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(event) => setName(event.target.value)} disabled={isSaving} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email ?? ""} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+92 300 1234567"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Headline</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Frontend developer"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Lahore, Pakistan"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={getRoleLabel(user?.role)} readOnly />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">About</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="A short professional summary"
                  maxLength={500}
                  disabled={isSaving}
                />
              </div>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isSaving ? "Saving..." : "Save profile"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
