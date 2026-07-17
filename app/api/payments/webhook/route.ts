import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleWebhook } from "@/lib/yookassa"
import { logBookingAudit } from "@/lib/audit"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event, paymentId, status, metadata } = handleWebhook(body)

    const payment = await prisma.payment.findUnique({
      where: { yookassaId: paymentId },
      include: { booking: true },
    })

    if (!payment) {
      console.error("Payment not found for webhook:", paymentId)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        paymentMethod: body.object?.payment_method?.type || payment.paymentMethod,
      },
    })

    let bookingPaymentStatus: string | null = null

    if (event === "payment.succeeded") {
      bookingPaymentStatus = "paid"
    } else if (event === "payment.canceled") {
      const allCanceled = await prisma.payment.findMany({
        where: {
          bookingId: payment.bookingId,
          status: { not: "canceled" },
        },
      })
      bookingPaymentStatus = allCanceled.length === 0 ? "unpaid" : null
    }

    if (bookingPaymentStatus) {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: bookingPaymentStatus },
      })

      await logBookingAudit({
        bookingId: payment.bookingId,
        action: "payment_status_changed",
        newStatus: bookingPaymentStatus,
        details: `Payment ${paymentId} event: ${event}`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
