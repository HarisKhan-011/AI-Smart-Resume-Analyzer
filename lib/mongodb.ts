import dns from "node:dns"
import mongoose from "mongoose"

dns.setDefaultResultOrder("ipv4first")

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache
}

const CONNECTION_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
} as const

function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL)
}

function getMongoUri() {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    throw new Error(
      isVercelRuntime()
        ? "MONGODB_URI is not set. In Vercel → Settings → Environment Variables, add MONGODB_URI for Production, Preview, and Development, then Redeploy."
        : "MONGODB_URI is not set. Add it to .env.local (or .env) and restart the server."
    )
  }
  return uri
}

export async function dbConnect(): Promise<typeof mongoose> {
  const cache = globalForMongoose.mongooseCache ?? { conn: null, promise: null }
  globalForMongoose.mongooseCache = cache

  if (cache.conn?.connection.readyState === 1) {
    return cache.conn
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 5,
      family: 4,
    })
  }

  try {
    cache.conn = await cache.promise
    return cache.conn
  } catch (error) {
    cache.promise = null
    cache.conn = null
    throw error
  }
}

export function isDatabaseUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const name = "name" in error ? String(error.name) : ""
  const message = "message" in error ? String(error.message) : ""
  return (
    name === "MongooseServerSelectionError" ||
    name === "MongoServerSelectionError" ||
    name === "MongoNetworkError" ||
    name === "MongoTimeoutError" ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND") ||
    message.includes("ETIMEDOUT") ||
    message.includes("querySrv") ||
    message.includes("MongoServerSelectionError") ||
    message.includes("MONGODB_URI is not set") ||
    message.includes("whitelist") ||
    message.includes("Could not connect to any servers") ||
    /authentication failed/i.test(message)
  )
}

export function getDatabaseUnavailableMessage(error?: unknown): string {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : ""
  if (isVercelRuntime()) {
    if (message.includes("MONGODB_URI is not set")) {
      return "MONGODB_URI is missing on this Vercel deployment. Add it under Settings → Environment Variables for Production and Preview, then Redeploy."
    }
    return "Vercel cannot reach MongoDB Atlas. Confirm MONGODB_URI is set for Preview and Production, Redeploy, and in Atlas → Network Access allow 0.0.0.0/0."
  }
  return "Cannot connect to MongoDB. Start MongoDB locally or set MONGODB_URI in .env.local to a MongoDB Atlas connection string."
}

export function getConnectionStateLabel(readyState: number): string {
  return CONNECTION_STATES[readyState as keyof typeof CONNECTION_STATES] ?? "unknown"
}

export async function getDatabaseHealth(): Promise<{
  ok: boolean
  status: string
  readyState: number
  database?: string | null
  error?: string
}> {
  try {
    const connection = await dbConnect()
    const readyState = connection.connection.readyState
    await connection.connection.db?.admin().command({ ping: 1 })

    return {
      ok: readyState === 1,
      status: getConnectionStateLabel(readyState),
      readyState,
      database: connection.connection.name,
    }
  } catch (error) {
    return {
      ok: false,
      status: "error",
      readyState: mongoose.connection.readyState,
      error: error instanceof Error ? error.message : "Unknown database error",
    }
  }
}
