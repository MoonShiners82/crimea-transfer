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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { driver, res } = await requireDriver()
    if (res) return res

    const { id } = await params
    const { status } = await req.json()

    const allowedStatuses = ["in_progress", "completed"]
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Недопустимый статус" }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { route: true }
    })

    if (!booking) {
      return NextResponse.json({ error: "Бронирование не найдено" }, { status: 404 })
    }

    if (booking.driverId !== driver!.id && booking.driverName !== driver!.name) {
      return NextResponse.json({ error: "Это бронирование не назначено на вас" }, { status: 403 })
    }

    if (booking.status !== "confirmed" && status === "in_progress") {
      return NextResponse.json({ error: "Можно начать только подтверждённое бронирование" }, { status: 400 })
    }

    if (booking.status !== "in_progress" && status === "completed") {
      return NextResponse.json({ error: "Можно завершить только начатое бронирование" }, { status: 400 })
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json({ success: true, booking: updated })
  } catch (error) {
    console.error("Update booking status error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
