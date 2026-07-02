import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "SMS Code",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        code: { label: "Code", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          return null
        }

        const phone = credentials.phone as string
        const code = credentials.code as string

        // Ищем последний код в БД
        const otp = await prisma.otpCode.findFirst({
          where: {
            phone,
            isUsed: false,
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        if (!otp) {
          return null
        }

        // Если это Flash Call — принимаем любые 4 цифры
        if (otp.code === "flashcall") {
          if (code.length !== 4 || !/^\d{4}$/.test(code)) {
            return null
          }
        } else {
          // Обычная проверка кода
          if (otp.code !== code) {
            return null
          }
        }

        // Помечаем код как использованный
        await prisma.otpCode.update({
          where: { id: otp.id },
          data: { isUsed: true }
        })

        // Находим или создаём пользователя
        let user = await prisma.user.findUnique({
          where: { phone }
        })

        if (!user) {
          user = await prisma.user.create({
            data: { phone }
          })
        }

        return {
          id: user.id,
          phone: user.phone,
          name: user.name
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.phone = user.phone
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).phone = token.phone as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
