import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth", "mongoose", "mongodb", "bcryptjs"],
}

export default nextConfig
