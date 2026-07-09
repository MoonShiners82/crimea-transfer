import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { phone: session.user.phone as string } })
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { bookingId, priceFinal, driverName, driverPhone, carInfo } = await req.json()
    if (!bookingId) return NextResponse.json({ error: "Booking ID required" }, { status: 400 })

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(priceFinal !== undefined && { priceFinal }),
        ...(driverName !== undefined && { driverName }),
        ...(driverPhone !== undefined && { driverPhone }),
        ...(carInfo !== undefined && { carInfo }),
      }
    })

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error("Edit booking error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
