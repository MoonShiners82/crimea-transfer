import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession( authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Доступ запрещён" },
        { status: 403 }
      )
    }

    const { bookingId, driverName, driverPhone, carInfo, priceFinal } = await req.json()

    if (!bookingId || !driverName || !driverPhone || !carInfo || !priceFinal) {
      return NextResponse.json(
        { error: "Все поля обязательны" },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "confirmed",
        driverName,
        driverPhone,
        carInfo,
        priceFinal,
        confirmedAt: new Date()
      },
      include: {
        user: { select: { phone: true } },
        route: { select: { fromPoint: true, toPoint: true } }
      }
    })

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error("Confirm booking error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
