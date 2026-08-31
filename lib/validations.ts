import { z } from "zod"

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = []

  if (!email) {
    errors.push("Email is required")
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Invalid email format")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = []

  if (!password) {
    errors.push("Password is required")
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateResumeFile(file: File): ValidationResult {
  const errors: string[] = []
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]

  if (!file) {
    errors.push("File is required")
  } else if (!allowedTypes.includes(file.type)) {
    errors.push("Only PDF and Word documents are allowed")
  } else if (file.size > 5 * 1024 * 1024) {
    errors.push("File size must be less than 5MB")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .max(72, "Password is too long"),
})

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: "Full name is required" })
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(80, "Full name must be 80 characters or less"),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address")
      .max(255)
      .transform((value) => value.toLowerCase()),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z
      .string({ required_error: "Confirm your password" })
      .min(1, "Confirm your password"),
    role: z.enum(["candidate", "recruiter"], {
      required_error: "Select a role",
      invalid_type_error: "Role must be candidate or recruiter",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
