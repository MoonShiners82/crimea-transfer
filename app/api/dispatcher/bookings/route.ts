import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function checkDispatcher() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: "Необходима авторизация", status: 401 }

  const user = await prisma.user.findUnique({
    where: { phone: session.user.phone as string }
  })

  if (!user || user.role !== "dispatcher") return { error: "Доступ запрещён", status: 403 }
  return { user }
}

export async function GET(req: Request) {
  try {
    const check = await checkDispatcher()
    if ("error" in check) return NextResponse.json(check, { status: check.status })

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
