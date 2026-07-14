import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

async function requireDriver() {
  const result = await requireAuth()
  if (result.res) return result

  const driver = await prisma.driver.findUnique({
    where: { userId: result.dbUser.id }
  })

  if (!driver || driver.status !== "approved") {
    return { user: null, dbUser: null, driver: null, res: NextResponse.json({ error: "Доступ запрещён" }, { status: 403 }) }
  }

  return { ...result, driver, res: null }
}

export async function GET() {
  try {
    const { driver, res } = await requireDriver()
    if (res) return res

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { driverId: driver!.id },
          { driverName: driver!.name }
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
