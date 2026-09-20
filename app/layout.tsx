import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { auth } from "@/auth"
import { SessionProvider } from "@/components/providers/session-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "ResumeAI — Smart Resume Analyzer & Job Matcher",
  description:
    "AI-powered resume analysis, job matching, and skill gap analysis.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    console.error("Auth session unavailable", error)
  }

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  )
}
