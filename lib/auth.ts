import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    // Password login for staff (dispatcher/driver)
    CredentialsProvider({
      name: "Password",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null

        const phone = normalizePhone(credentials.phone)
        const user = await prisma.user.findUnique({ where: { phone } })

        if (!user || !user.passwordHash) return null
        if (user.role !== "dispatcher" && user.role !== "driver") return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, phone: user.phone, name: user.name, role: user.role }
      }
    }),
    // FlashCall login for customers
    CredentialsProvider({
      name: "Callback",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        verificationToken: { label: "Verification Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.verificationToken) return null

        const phone = normalizePhone(credentials.phone)
        const token = credentials.verificationToken as string

        const verificationToken = await prisma.verificationToken.findUnique({
          where: { token }
        })

        if (
          !verificationToken ||
          verificationToken.phone !== phone ||
          verificationToken.isUsed ||
          verificationToken.expiresAt < new Date()
        ) {
          return null
        }

        await prisma.verificationToken.update({
          where: { id: verificationToken.id },
          data: { isUsed: true }
        })

        let user = await prisma.user.findUnique({ where: { phone } })
        if (!user) {
          user = await prisma.user.create({ data: { phone } })
        }

        return { id: user.id, phone: user.phone, name: user.name, role: user.role }
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: { signIn: '/auth/signin' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.phone = user.phone
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.phone = token.phone as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, "")
  if (clean.startsWith("8")) clean = "7" + clean.slice(1)
  if (!clean.startsWith("7")) clean = "7" + clean
  return "+" + clean
}

export default NextAuth(authOptions)
