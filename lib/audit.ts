import { prisma } from "./prisma"

export async function logBookingAudit(params: {
  bookingId: string
  action: string
  oldStatus?: string
  newStatus?: string
  performedBy?: string
  details?: string
}) {
  try {
    await prisma.bookingAudit.create({
      data: {
        bookingId: params.bookingId,
        action: params.action,
        oldStatus: params.oldStatus || null,
        newStatus: params.newStatus || null,
        performedBy: params.performedBy || null,
        details: params.details || null,
      }
    })
  } catch (e) {
    console.error("Audit log error:", e)
  }
}
