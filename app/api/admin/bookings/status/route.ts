import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { logBookingAudit } from "@/lib/audit"

export async function POST(req: Request) {
  try {
    const { res, user } = requireRole(["admin", "dispatcher"], req)
    if (res) return res

    const { bookingId, status, reason } = await req.json()

    if (!bookingId || !status) {
      return NextResponse.json({ error: "bookingId и status обязательны" }, { status: 400 })
    }

    const allowedStatuses = ["confirmed", "in_progress", "completed", "cancelled"]
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Недопустимый статус" }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })

    if (!booking) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
    }

    const validTransitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["in_progress", "completed", "cancelled"],
      in_progress: ["completed", "cancelled"]
    }

    if (!validTransitions[booking.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Нельзя изменить статус с "${booking.status}" на "${status}"` },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { status }

    if (status === "confirmed") {
      updateData.confirmedAt = new Date()
    }

    if (status === "cancelled" && reason) {
      updateData.cancelReason = reason
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        user: { select: { phone: true, name: true } },
        route: { select: { id: true, fromPoint: true, toPoint: true } }
      }
    })

    await logBookingAudit({
      bookingId,
      action: "status_change",
      oldStatus: booking.status,
      newStatus: status,
      performedBy: user?.phone,
      details: reason || undefined,
    })

    return NextResponse.json({ success: true, booking: updated })
  } catch (error) {
    console.error("Update booking status error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
