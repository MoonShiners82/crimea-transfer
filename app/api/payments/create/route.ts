import { NextResponse } from "next/server"
import { requireAuthWithDB } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { createPayment } from "@/lib/yookassa"

export async function POST(req: Request) {
  try {
    const { dbUser, res } = await requireAuthWithDB(req)
    if (res) return res

    const { bookingId } = await req.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    if (booking.userId !== dbUser.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "Booking is already paid" },
        { status: 400 }
      )
    }

    const existingPendingPayment = booking.payments.find(
      (p) => p.status === "pending" || p.status === "waiting_for_capture"
    )
    if (existingPendingPayment && existingPendingPayment.confirmationUrl) {
      return NextResponse.json({
        confirmationUrl: existingPendingPayment.confirmationUrl,
      })
    }

    const amount = booking.priceFinal || booking.priceCalculated
    const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/booking/${bookingId}/confirmation`

    const yookassaPayment = await createPayment(amount, bookingId, returnUrl)

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        yookassaId: yookassaPayment.id,
        amount,
        status: yookassaPayment.status,
        paymentMethod: yookassaPayment.payment_method?.type || null,
        confirmationUrl: yookassaPayment.confirmation?.confirmation_url || null,
      },
    })

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: "unpaid" },
    })

    return NextResponse.json({
      paymentId: payment.id,
      confirmationUrl: payment.confirmationUrl,
    })
  } catch (error) {
    console.error("Create payment error:", error)
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    )
  }
}
