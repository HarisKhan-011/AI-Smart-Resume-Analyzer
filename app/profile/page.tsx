"use client"

import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <FeaturePlaceholder
        title="Profile"
        description="Manage your account profile and preferences."
        icon={User}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                <Input id="name" placeholder="Demo User" disabled />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input id="email" type="email" placeholder="demo@example.com" disabled />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Job Title</label>
              <Input id="title" placeholder="Software Developer" />
            </div>
            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">Bio</label>
              <Textarea id="bio" placeholder="Tell us about yourself..." rows={4} />
            </div>
            <Button type="submit" disabled>Save Changes</Button>
            <p className="text-xs text-muted-foreground">
              Profile saving will be connected when authentication is implemented.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
