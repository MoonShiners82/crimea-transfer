import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

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
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })
    if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { phone } = await req.json()
    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 })

    // Normalize phone
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
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })
    if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

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
