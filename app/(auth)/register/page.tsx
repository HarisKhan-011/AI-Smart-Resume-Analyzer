import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <AuthShell title="Create an account" description="Get started with ResumeAI">
      <RegisterForm />
    </AuthShell>
  )
}
