import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Callback",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        verificationToken: { label: "Verification Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.verificationToken) {
          return null
        }

        const phone = credentials.phone as string
        const token = credentials.verificationToken as string

        let clean = phone.replace(/\D/g, "")
        if (clean.startsWith("8")) clean = "7" + clean.slice(1)
        if (!clean.startsWith("7")) clean = "7" + clean
        const normalizedPhone = "+" + clean

        const verificationToken = await prisma.verificationToken.findUnique({
          where: { token }
        })

        if (
          !verificationToken ||
          verificationToken.phone !== normalizedPhone ||
          verificationToken.isUsed ||
          verificationToken.expiresAt < new Date()
        ) {
          return null
        }

        await prisma.verificationToken.update({
          where: { id: verificationToken.id },
          data: { isUsed: true }
        })

        let user = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
        if (!user) {
          user = await prisma.user.create({ data: { phone: normalizedPhone } })
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
        token.phone = (user as any).phone
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).phone = token.phone as string
        (session.user as any).role = token.role as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
