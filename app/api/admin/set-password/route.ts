import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })
    if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { userId, password } = await req.json()

    if (!userId || !password) {
      return NextResponse.json({ error: "userId and password required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Пароль минимум 6 символов" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    if (user.role !== "dispatcher" && user.role !== "driver") {
      return NextResponse.json({ error: "Пароль можно назначить только диспетчеру или водителю" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Set password error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
