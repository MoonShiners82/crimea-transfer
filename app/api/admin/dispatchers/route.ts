import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { res } = await requireRole("admin")
    if (res) return res

    const dispatchers = await prisma.user.findMany({
      where: { role: "dispatcher" },
      select: { id: true, phone: true, name: true, role: true },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(dispatchers)
  } catch (error) {
    console.error("Get dispatchers error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { res } = await requireRole("admin")
    if (res) return res

    const { phone } = await req.json()
    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 })

    let clean = phone.replace(/\D/g, "")
    if (clean.startsWith("8")) clean = "7" + clean.slice(1)
    if (!clean.startsWith("7")) clean = "7" + clean
    const normalizedPhone = "+" + clean

    const targetUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Пользователь не найден. Он должен сначала войти на сайт." }, { status: 404 })
    }

    if (targetUser.role === "admin") {
      return NextResponse.json({ error: "Нельзя изменить роль администратора" }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: "dispatcher" }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Set dispatcher error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { res } = await requireRole("admin")
    if (res) return res

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (targetUser.role !== "dispatcher") return NextResponse.json({ error: "Not a dispatcher" }, { status: 400 })

    await prisma.user.update({
      where: { id },
      data: { role: "user" }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove dispatcher error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
