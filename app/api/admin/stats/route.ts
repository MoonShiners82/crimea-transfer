import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      todayBookings,
      weekBookings,
      monthBookings,
      revenueResult,
      todayRevenueResult,
      avgPriceResult,
      totalUsers,
      popularRoutes,
      recentBookings
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "pending" } }),
      prisma.booking.count({ where: { status: "confirmed" } }),
      prisma.booking.count({ where: { status: "completed" } }),
      prisma.booking.count({ where: { status: "cancelled" } }),
      prisma.booking.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.booking.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.booking.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.booking.aggregate({
        _sum: { priceFinal: true, priceCalculated: true },
        where: { status: { in: ["confirmed", "completed"] } }
      }),
      prisma.booking.aggregate({
        _sum: { priceFinal: true, priceCalculated: true },
        where: {
          status: { in: ["confirmed", "completed"] },
          createdAt: { gte: todayStart }
        }
      }),
      prisma.booking.aggregate({
        _avg: { priceFinal: true, priceCalculated: true },
        where: { status: { in: ["confirmed", "completed"] } }
      }),
      prisma.user.count(),
      prisma.booking.groupBy({
        by: ["routeId"],
        _count: true,
        orderBy: { _count: { routeId: "desc" } },
        take: 5
      }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { phone: true, name: true } },
          route: { select: { fromPoint: true, toPoint: true } }
        }
      })
    ])

    const routesWithDetails = await Promise.all(
      popularRoutes.map(async (r) => {
        const route = await prisma.route.findUnique({
          where: { id: r.routeId }
        })
        return {
          fromPoint: route?.fromPoint || "—",
          toPoint: route?.toPoint || "—",
          count: r._count
        }
      })
    )

    const totalRevenue = revenueResult._sum.priceFinal || revenueResult._sum.priceCalculated || 0
    const todayRevenue = todayRevenueResult._sum.priceFinal || todayRevenueResult._sum.priceCalculated || 0
    const avgPrice = Math.round(avgPriceResult._avg.priceFinal || avgPriceResult._avg.priceCalculated || 0)

    return NextResponse.json({
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        today: todayBookings,
        week: weekBookings,
        month: monthBookings
      },
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
        average: avgPrice
      },
      users: {
        total: totalUsers
      },
      popularRoutes: routesWithDetails,
      recentBookings
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
