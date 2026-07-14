import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { res } = await requireRole("dispatcher")
    if (res) return res

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { user: { phone: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { route: { fromPoint: { contains: search, mode: "insensitive" } } },
        { route: { toPoint: { contains: search, mode: "insensitive" } } },
        { driverName: { contains: search, mode: "insensitive" } }
      ]
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { phone: true, name: true } },
        route: { select: { fromPoint: true, toPoint: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Get dispatcher bookings error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
