import mongoose from "mongoose"

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

function getMongoUri() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (or .env) and restart the server."
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
      serverSelectionTimeoutMS: 10000,
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
    message.includes("ECONNREFUSED") ||
    message.includes("MongoServerSelectionError") ||
    message.includes("MONGODB_URI is not set")
  )
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
