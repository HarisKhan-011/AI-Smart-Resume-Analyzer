import mongoose from "mongoose"

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache
}

function getMongoUri() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to your environment variables.")
  }
  return uri
}

export async function dbConnect(): Promise<typeof mongoose> {
  const cache = globalForMongoose.mongooseCache ?? { conn: null, promise: null }
  globalForMongoose.mongooseCache = cache

  if (cache.conn) {
    return cache.conn
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
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
    message.includes("MongoServerSelectionError")
  )
}
