import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signToken, setTokenCookie } from "@/lib/jwt"

function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, "")
  if (clean.startsWith("8")) clean = "7" + clean.slice(1)
  if (!clean.startsWith("7")) clean = "7" + clean
  return "+" + clean
}

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json({ error: "Телефон и пароль обязательны" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)
    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Неверный телефон или пароль" }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Неверный телефон или пароль" }, { status: 401 })
    }

    const token = await signToken({
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    })

    await setTokenCookie(token)

    return NextResponse.json({
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role }
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
