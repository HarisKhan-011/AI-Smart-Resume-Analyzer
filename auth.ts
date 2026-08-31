import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "@/auth.config"
import { dbConnect } from "@/lib/db"
import { verifyPassword } from "@/lib/password"
import { loginSchema } from "@/lib/validations"
import { User } from "@/models/user"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        try {
          await dbConnect()

          const user = await User.findOne({
            email: parsed.data.email.toLowerCase(),
          }).select("+passwordHash")

          if (!user?.passwordHash) {
            return null
          }

          const isValid = await verifyPassword(parsed.data.password, user.passwordHash)
          if (!isValid) {
            return null
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image ?? null,
            role: user.role,
          }
        } catch (error) {
          console.error("Login database error:", error)
          return null
        }
      },
    }),
  ],
})
