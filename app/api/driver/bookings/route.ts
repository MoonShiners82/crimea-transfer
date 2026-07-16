import { NextResponse } from "next/server"
import { requireAuthWithDB } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import type { Driver } from "@prisma/client"

async function requireDriver(req?: Request): Promise<{ driver: Driver; res: null } | { driver: null; res: NextResponse }> {
  const result = await requireAuthWithDB(req)
  if (result.res) return { driver: null, res: result.res }

  const driver = await prisma.driver.findUnique({
    where: { userId: result.dbUser.id }
  })

  if (!driver || driver.status !== "approved") {
    return { driver: null, res: NextResponse.json({ error: "Доступ запрещён" }, { status: 403 }) }
  }

  return { driver, res: null }
}

export async function GET(req: Request) {
  try {
    const { driver, res } = await requireDriver(req)
    if (res) return res

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
