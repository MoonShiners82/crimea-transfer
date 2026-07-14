import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (booking.driverId !== driver.id && booking.driverName !== driver.name) {
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
