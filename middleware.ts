import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authConfig } from "@/auth.config"

// Next.js Edge middleware only inlines env vars referenced in this file.
void process.env.AUTH_SECRET
void process.env.NEXTAUTH_SECRET
import {
  canAccessAdminRoutes,
  canAccessRecruiterRoutes,
  getPostLoginPath,
  isAdminPath,
  isAuthPage,
  isProtectedPath,
  isRecruiterPath,
} from "@/lib/auth-paths"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const pathname = nextUrl.pathname
  const isLoggedIn = !!req.auth?.user
  const role = req.auth?.user?.role

  if (isAuthPage(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL(getPostLoginPath(role), nextUrl))
  }

  if (isProtectedPath(pathname) && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isRecruiterPath(pathname) && isLoggedIn && !canAccessRecruiterRoutes(role)) {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl))
  }

  if (isAdminPath(pathname) && isLoggedIn && !canAccessAdminRoutes(role)) {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
