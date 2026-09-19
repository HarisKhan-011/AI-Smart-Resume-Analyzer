const MONGO_URI_KEYS = ["MONGODB_URI", "MONGODB_URL", "MONGO_URI", "DATABASE_URL"] as const

function stripWrappingQuotes(value: string): string {
  return value.trim().replace(/^['"]+|['"]+$/g, "").trim()
}

export function readMongoUri(env: NodeJS.Dict<string | undefined> = process.env): string {
  for (const key of MONGO_URI_KEYS) {
    const value = stripWrappingQuotes(String(env[key] ?? ""))
    if (value) return value
  }
  return ""
}

export function isMongoUriConfigured(env: NodeJS.Dict<string | undefined> = process.env): boolean {
  return Boolean(readMongoUri(env))
}
