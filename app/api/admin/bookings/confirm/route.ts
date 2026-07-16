import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { res } = requireRole(["admin", "dispatcher"], req)
    if (res) return res

    const { bookingId, driverName, driverPhone, carInfo, priceFinal, driverId } = await req.json()

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
        ...(driverId && { driverId }),
        confirmedAt: new Date()
      },
      include: {
        user: { select: { phone: true } },
        route: { select: { id: true, fromPoint: true, toPoint: true } }
      }
    })

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error("Confirm booking error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
