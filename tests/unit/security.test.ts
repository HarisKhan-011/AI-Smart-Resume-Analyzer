import { describe, expect, it } from "@jest/globals"
import {
  canAccessAdminRoutes,
  canAccessRecruiterRoutes,
  getPostLoginPath,
  isAdminPath,
  isAuthPage,
  isProtectedPath,
  isRecruiterPath,
} from "@/lib/auth-paths"
import { registerSchema } from "@/lib/validations"
import { toPublicUser, type UserDocument } from "@/models/user"
import { RecruiterError } from "@/services/recruiter/recruiter-job-service"
import { getRecruiterCandidateDetail } from "@/services/recruiter/recruiter-candidate-service"

describe("route protection helpers", () => {
  it("marks candidate and recruiter app paths as protected", () => {
    expect(isProtectedPath("/resume-improve")).toBe(true)
    expect(isProtectedPath("/interview-prep")).toBe(true)
    expect(isProtectedPath("/career-roadmap")).toBe(true)
    expect(isProtectedPath("/resume/upload")).toBe(true)
    expect(isProtectedPath("/recruiter/jobs")).toBe(true)
    expect(isProtectedPath("/admin")).toBe(true)
    expect(isProtectedPath("/")).toBe(false)
    expect(isProtectedPath("/login")).toBe(false)
  })

  it("identifies recruiter and admin routes", () => {
    expect(isRecruiterPath("/recruiter")).toBe(true)
    expect(isRecruiterPath("/recruiter/candidates/1")).toBe(true)
    expect(isRecruiterPath("/dashboard")).toBe(false)
    expect(isAdminPath("/admin")).toBe(true)
    expect(isAdminPath("/admin/users")).toBe(true)
    expect(isAuthPage("/login")).toBe(true)
    expect(isAuthPage("/register")).toBe(true)
  })

  it("blocks candidates from recruiter and admin routes", () => {
    expect(canAccessRecruiterRoutes("candidate")).toBe(false)
    expect(canAccessRecruiterRoutes("recruiter")).toBe(true)
    expect(canAccessRecruiterRoutes("admin")).toBe(true)
    expect(canAccessAdminRoutes("recruiter")).toBe(false)
    expect(canAccessAdminRoutes("admin")).toBe(true)
  })

  it("sends each role to the correct home after login", () => {
    expect(getPostLoginPath("candidate")).toBe("/dashboard")
    expect(getPostLoginPath("recruiter")).toBe("/recruiter")
    expect(getPostLoginPath("admin")).toBe("/admin")
  })
})

describe("registration and user DTO safety", () => {
  it("rejects admin as a public registration role", () => {
    const parsed = registerSchema.safeParse({
      name: "Pat Admin",
      email: "pat@example.com",
      password: "password12",
      confirmPassword: "password12",
      role: "admin",
    })
    expect(parsed.success).toBe(false)
  })

  it("omits passwordHash from the public user DTO", () => {
    const dto = toPublicUser({
      _id: { toString: () => "507f1f77bcf86cd799439012" },
      name: "Alex Candidate",
      email: "alex@example.com",
      passwordHash: "should-not-leak",
      role: "candidate",
      image: null,
      createdAt: new Date("2026-09-01"),
      updatedAt: new Date("2026-09-01"),
    } as unknown as UserDocument)

    expect(dto).not.toHaveProperty("passwordHash")
    expect(JSON.stringify(dto)).not.toContain("should-not-leak")
    expect(dto.email).toBe("alex@example.com")
  })
})

describe("recruiter candidate access", () => {
  it("rejects invalid candidate ids before loading private resume text", async () => {
    await expect(getRecruiterCandidateDetail("507f1f77bcf86cd799439012", "not-an-id")).rejects.toEqual(
      expect.objectContaining({
        name: "RecruiterError",
        status: 404,
      })
    )
    await expect(getRecruiterCandidateDetail("507f1f77bcf86cd799439012", "not-an-id")).rejects.toBeInstanceOf(
      RecruiterError
    )
  })
})
