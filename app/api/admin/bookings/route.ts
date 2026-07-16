import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { getPaginationParams, paginatedResponse } from "@/lib/pagination"

export async function GET(req: Request) {
  try {
    const { res } = requireRole("admin", req)
    if (res) return res

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const pagination = getPaginationParams(searchParams)

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

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: { select: { phone: true, name: true } },
          route: { select: { id: true, fromPoint: true, toPoint: true } }
        },
        orderBy: { createdAt: "desc" },
        take: pagination.limit,
        skip: pagination.offset,
      }),
      prisma.booking.count({ where })
    ])

    return NextResponse.json(paginatedResponse(bookings, total, pagination))
  } catch (error) {
    console.error("Get bookings error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
