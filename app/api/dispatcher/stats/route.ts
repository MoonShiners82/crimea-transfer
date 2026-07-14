import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { res } = await requireRole("dispatcher")
    if (res) return res

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalToday,
      pendingToday,
      confirmedToday,
      completedToday,
      cancelledToday,
      totalWeek,
      totalMonth,
      revenue
    ] = await Promise.all([
      prisma.booking.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.booking.count({ where: { status: "pending", createdAt: { gte: todayStart } } }),
      prisma.booking.count({ where: { status: "confirmed", createdAt: { gte: todayStart } } }),
      prisma.booking.count({ where: { status: "completed", createdAt: { gte: todayStart } } }),
      prisma.booking.count({ where: { status: "cancelled", createdAt: { gte: todayStart } } }),
      prisma.booking.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.booking.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.booking.aggregate({
        where: { status: "completed", createdAt: { gte: todayStart } },
        _sum: { priceFinal: true }
      })
    ])

    return NextResponse.json({
      today: { total: totalToday, pending: pendingToday, confirmed: confirmedToday, completed: completedToday, cancelled: cancelledToday },
      week: totalWeek,
      month: totalMonth,
      revenue: revenue._sum.priceFinal || 0
    })
  } catch (error) {
    console.error("Get dispatcher stats error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
