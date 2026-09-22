const MONGO_URI_KEYS = ["MONGODB_URI", "MONGODB_URL", "MONGO_URI", "DATABASE_URL"] as const
const MONGO_SCHEME = /^(mongodb(?:\+srv)?:\/\/)/i
const ENV_KEY_PREFIX = /^(?:export\s+)?(?:MONGODB_URI|MONGODB_URL|MONGO_URI|DATABASE_URL)\s*=\s*/i

function stripWrappingQuotes(value: string): string {
  return value.trim().replace(/^['"]+|['"]+$/g, "").trim()
}

function normalizeMongoUri(value: string): string {
  let next = stripWrappingQuotes(value).replace(/\s+/g, "")
  next = next.replace(ENV_KEY_PREFIX, "")
  next = stripWrappingQuotes(next)
  return MONGO_SCHEME.test(next) ? next : ""
}

export function readMongoUri(env: NodeJS.Dict<string | undefined> = process.env): string {
  for (const key of MONGO_URI_KEYS) {
    const value = normalizeMongoUri(String(env[key] ?? ""))
    if (value) return value
  }
  return ""
}

export function isMongoUriConfigured(env: NodeJS.Dict<string | undefined> = process.env): boolean {
  return Boolean(readMongoUri(env))
}
