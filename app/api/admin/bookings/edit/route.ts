import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { res } = requireRole(["admin", "dispatcher"], req)
    if (res) return res

    const { bookingId, priceFinal, driverName, driverPhone, carInfo, routeId, notes } = await req.json()
    if (!bookingId) return NextResponse.json({ error: "Booking ID required" }, { status: 400 })

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(priceFinal !== undefined && { priceFinal }),
        ...(driverName !== undefined && { driverName }),
        ...(driverPhone !== undefined && { driverPhone }),
        ...(carInfo !== undefined && { carInfo }),
        ...(routeId !== undefined && { routeId }),
        ...(notes !== undefined && { notes }),
      }
    })

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error("Edit booking error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
