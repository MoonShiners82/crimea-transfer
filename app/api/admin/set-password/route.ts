import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { res } = await requireRole("admin")
    if (res) return res

    const { userId, password } = await req.json()

    if (!userId || !password) {
      return NextResponse.json({ error: "userId and password required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Пароль минимум 8 символов" }, { status: 400 })
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "Пароль должен содержать хотя бы одну заглавную букву" }, { status: 400 })
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: "Пароль должен содержать хотя бы одну строчную букву" }, { status: 400 })
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: "Пароль должен содержать хотя бы одну цифру" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    if (user.role !== "dispatcher" && user.role !== "driver" && user.role !== "admin") {
      return NextResponse.json({ error: "Пароль можно назначить только администратору, диспетчеру или водителю" }, { status: 400 })
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
