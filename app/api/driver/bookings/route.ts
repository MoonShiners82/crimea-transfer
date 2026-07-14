import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: user.id }
    })

    if (!driver || driver.status !== "approved") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { driverId: driver.id },
          { driverName: driver.name }
        ]
      },
      include: {
        user: { select: { phone: true, name: true } },
        route: { select: { fromPoint: true, toPoint: true, distanceKm: true, durationMin: true } }
      },
      orderBy: { datetime: "desc" }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Get driver bookings error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
