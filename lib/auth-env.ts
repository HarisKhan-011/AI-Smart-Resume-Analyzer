const LOCAL_HOST = /localhost|127\.0\.0\.1/i

export function resolveAuthUrl(env: NodeJS.Dict<string> = process.env): string | undefined {
  const vercelHost = env.VERCEL_URL?.trim().replace(/^https?:\/\//, "")
  const current = (env.AUTH_URL ?? env.NEXTAUTH_URL ?? "").trim()

  if (vercelHost && (!current || LOCAL_HOST.test(current))) {
    return `https://${vercelHost}`
  }

  return current || undefined
}

export function applyAuthEnv(env: NodeJS.ProcessEnv = process.env): void {
  const url = resolveAuthUrl(env)
  if (url) env.AUTH_URL = url
}
