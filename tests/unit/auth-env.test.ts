import { describe, expect, it } from "@jest/globals"
import { resolveAuthUrl } from "@/lib/auth-env"

describe("auth production URL", () => {
  it("replaces localhost AUTH_URL with the Vercel https host", () => {
    expect(
      resolveAuthUrl({
        AUTH_URL: "http://localhost:3000",
        VERCEL_URL: "ai-smart-resume-analyzer-sable.vercel.app",
      })
    ).toBe("https://ai-smart-resume-analyzer-sable.vercel.app")
  })

  it("keeps an explicit production AUTH_URL", () => {
    expect(
      resolveAuthUrl({
        AUTH_URL: "https://resumeai.example.com",
        VERCEL_URL: "ai-smart-resume-analyzer-sable.vercel.app",
      })
    ).toBe("https://resumeai.example.com")
  })
})
