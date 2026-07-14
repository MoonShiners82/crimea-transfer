import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { res } = await requireRole("admin")
    if (res) return res

    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") || "csv"
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { user: { phone: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { route: { fromPoint: { contains: search, mode: "insensitive" } } },
        { route: { toPoint: { contains: search, mode: "insensitive" } } },
      ]
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { phone: true, name: true } },
        route: { select: { fromPoint: true, toPoint: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    if (format === "json") {
      return NextResponse.json(bookings, {
        headers: { "Content-Disposition": "attachment; filename=bookings.json" }
      })
    }

    const headers = ["ID", "Дата поездки", "Маршрут", "Телефон", "Имя", "Пассажиры", "Багаж", "Цена", "Цена финал", "Водитель", "Телефон водителя", "Авто", "Статус", "Создано"]
    const rows = bookings.map(b => [
      b.id,
      new Date(b.datetime).toLocaleString("ru"),
      `${b.route.fromPoint} → ${b.route.toPoint}`,
      b.user.phone,
      b.user.name || "",
      b.passengers,
      b.baggageType,
      b.priceCalculated,
      b.priceFinal || "",
      b.driverName || "",
      b.driverPhone || "",
      b.carInfo || "",
      b.status,
      new Date(b.createdAt).toLocaleString("ru")
    ])

    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=bookings.csv"
      }
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
