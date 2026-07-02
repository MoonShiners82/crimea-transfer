import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      phone?: string | null
      role?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    phone?: string | null
    role?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    phone?: string | null
    role?: string | null
  }
}
