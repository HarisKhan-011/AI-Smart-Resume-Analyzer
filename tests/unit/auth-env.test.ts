import { afterEach, describe, expect, it } from "@jest/globals"
import { resolveAuthUrl } from "@/lib/auth-env"
import { readMongoUri } from "@/lib/mongo-uri"
import {
  getDatabaseUnavailableMessage,
  isDatabaseUnavailable,
  isDuplicateKeyError,
  isMongooseValidationError,
} from "@/lib/mongodb"

describe("mongo uri reader", () => {
  it("reads MONGODB_URI at runtime and strips wrapping quotes", () => {
    expect(readMongoUri({ MONGODB_URI: '  "mongodb+srv://user:pass@cluster.mongodb.net/app"  ' })).toBe(
      "mongodb+srv://user:pass@cluster.mongodb.net/app"
    )
  })

  it("accepts common aliases so a misnamed Vercel variable still works", () => {
    expect(readMongoUri({ DATABASE_URL: "mongodb+srv://user:pass@cluster.mongodb.net/app" })).toContain(
      "mongodb+srv://"
    )
    expect(readMongoUri({})).toBe("")
  })

  it("ignores non-Mongo URLs and strips a pasted MONGODB_URI= prefix", () => {
    expect(
      readMongoUri({
        DATABASE_URL: "postgres://user:pass@host:5432/app",
        MONGODB_URI: "MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/app",
      })
    ).toBe("mongodb+srv://user:pass@cluster.mongodb.net/app")
    expect(readMongoUri({ DATABASE_URL: "postgres://user:pass@host:5432/app" })).toBe("")
  })
})

describe("database unavailable helpers", () => {
  const originalVercel = process.env.VERCEL

  afterEach(() => {
    if (originalVercel === undefined) delete process.env.VERCEL
    else process.env.VERCEL = originalVercel
  })

  it("detects Atlas and missing-URI failures", () => {
    expect(isDatabaseUnavailable({ name: "MongooseServerSelectionError", message: "failed" })).toBe(true)
    expect(isDatabaseUnavailable({ name: "MongoParseError", message: "Invalid scheme" })).toBe(true)
    expect(isDatabaseUnavailable({ name: "MongoNetworkTimeoutError", message: "timed out" })).toBe(true)
    expect(isDatabaseUnavailable(new Error("MONGODB_URI is not set. Add it to .env.local"))).toBe(true)
    expect(isDatabaseUnavailable(new Error("querySrv ENOTFOUND"))).toBe(true)
    expect(isDatabaseUnavailable(new Error("queryTxt EAI_AGAIN"))).toBe(true)
    expect(isDatabaseUnavailable(new Error("bad input"))).toBe(false)
    expect(isDatabaseUnavailable({ name: "ValidationError", message: "User validation failed" })).toBe(false)
    expect(isDuplicateKeyError({ code: 11000 })).toBe(true)
    expect(isDuplicateKeyError({ code: "11000" })).toBe(true)
    expect(isMongooseValidationError({ name: "ValidationError" })).toBe(true)
  })

  it("explains Vercel Atlas setup instead of local MongoDB", () => {
    process.env.VERCEL = "1"
    expect(getDatabaseUnavailableMessage()).toMatch(/Atlas/)
    expect(
      getDatabaseUnavailableMessage(new Error("MONGODB_URI is not set. In Vercel"))
    ).toMatch(/missing/)
    expect(
      getDatabaseUnavailableMessage({ name: "MongoParseError", message: "Invalid scheme, expected connection string to start with \"mongodb://\"" })
    ).toMatch(/connection string/)
    delete process.env.VERCEL
    expect(getDatabaseUnavailableMessage()).toMatch(/\.env\.local/)
  })
})

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
