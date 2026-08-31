"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registerSchema } from "@/lib/validations"
import { getPostLoginPath } from "@/lib/auth-paths"
import { cn } from "@/lib/utils"
import type { PublicRegisterRole } from "@/types/user"

type FieldErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword" | "role", string>
>

const roles: { value: PublicRegisterRole; title: string; description: string }[] = [
  {
    value: "candidate",
    title: "Candidate",
    description: "Analyze resumes and find matching jobs",
  },
  {
    value: "recruiter",
    title: "Recruiter",
    description: "Post jobs and review candidates",
  },
]

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<PublicRegisterRole>("candidate")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    const parsed = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
      role,
    })

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors
      setFieldErrors({
        name: flattened.name?.[0],
        email: flattened.email?.[0],
        password: flattened.password?.[0],
        confirmPassword: flattened.confirmPassword?.[0],
        role: flattened.role?.[0],
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      const data = (await response.json()) as {
        error?: string
        fieldErrors?: FieldErrors
        user?: { role?: PublicRegisterRole }
      }

      if (!response.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors)
        }
        setError(data.error ?? "Unable to create account.")
        return
      }

      const result = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      })

      if (!result?.ok) {
        router.push("/login?registered=1")
        return
      }

      router.push(getPostLoginPath(data.user?.role ?? parsed.data.role))
      router.refresh()
    } catch {
      setError("Unable to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Alex Rahman"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={!!fieldErrors.name}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
          disabled={isLoading}
          required
        />
        {fieldErrors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          disabled={isLoading}
          required
        />
        {fieldErrors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          disabled={isLoading}
          required
        />
        {fieldErrors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          aria-invalid={!!fieldErrors.confirmPassword}
          aria-describedby={fieldErrors.confirmPassword ? "confirm-error" : undefined}
          disabled={isLoading}
          required
        />
        {fieldErrors.confirmPassword && (
          <p id="confirm-error" className="text-sm text-destructive">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Role</legend>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account role">
          {roles.map((option) => (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-lg border p-3 text-left transition-colors focus-within:ring-2 focus-within:ring-ring",
                role === option.value
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-accent"
              )}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="sr-only"
                disabled={isLoading}
              />
              <span className="block text-sm font-medium">{option.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {option.description}
              </span>
            </label>
          ))}
        </div>
        {fieldErrors.role && (
          <p className="text-sm text-destructive">{fieldErrors.role}</p>
        )}
      </fieldset>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {isLoading ? "Creating account..." : "Register"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </form>
  )
}
