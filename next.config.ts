import type { NextConfig } from "next"
import { readMongoUri } from "./lib/mongo-uri"

if (process.env.VERCEL && !readMongoUri()) {
  throw new Error(
    "MONGODB_URI is missing on this Vercel build. Add MONGODB_URI in Vercel → Settings → Environment Variables for Production, Preview, and Development, then Redeploy."
  )
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth"],
}

export default nextConfig
