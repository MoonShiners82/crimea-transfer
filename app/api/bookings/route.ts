import { NextResponse } from "next/server"
import { requireAuthWithDB } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { logBookingAudit } from "@/lib/audit"

export async function GET(req: Request) {
  try {
    const { dbUser, res } = await requireAuthWithDB(req)
    if (res) return res

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where = { userId: dbUser.id, ...(status ? { status } : {}) }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          route: { select: { fromPoint: true, toPoint: true, distanceKm: true, durationMin: true } }
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset
      }),
      prisma.booking.count({ where })
    ])

    return NextResponse.json({ bookings, total, limit, offset })
  } catch (error) {
    console.error("Get bookings error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { dbUser, res } = await requireAuthWithDB(req)
    if (res) return res

    const data = await req.json()

    if (!data.datetime || !data.passengers || !data.baggageType) {
      return NextResponse.json(
        { error: "Все поля обязательны" },
        { status: 400 }
      )
    }

    const isCustomRoute = !!data.fromPoint && !!data.toPoint

    if (!data.routeId && !isCustomRoute) {
      return NextResponse.json(
        { error: "Укажите маршрут" },
        { status: 400 }
      )
    }

    let routeId = data.routeId
    let routeDistanceKm = 0
    let routeDurationMin = 0
    let routeFromPoint = ""
    let routeToPoint = ""
    let routePricePerBaggage = 500

    if (isCustomRoute) {
      routeDistanceKm = data.distanceKm || 0
      routeDurationMin = data.durationMin || Math.round(routeDistanceKm * 1.2)
      routeFromPoint = data.fromPoint
      routeToPoint = data.toPoint

      const existingRoute = await prisma.route.findFirst({
        where: { fromPoint: routeFromPoint, toPoint: routeToPoint }
      })

      if (existingRoute) {
        routeId = existingRoute.id
        routeDistanceKm = existingRoute.distanceKm
        routeDurationMin = existingRoute.durationMin
        routePricePerBaggage = existingRoute.pricePerBaggage
      } else {
        const newRoute = await prisma.route.create({
          data: {
            fromPoint: routeFromPoint,
            toPoint: routeToPoint,
            distanceKm: routeDistanceKm,
            durationMin: routeDurationMin,
            priceBase: 0,
            pricePerBaggage: routePricePerBaggage,
            isActive: false,
          }
        })
        routeId = newRoute.id
      }
    } else {
      const route = await prisma.route.findUnique({ where: { id: data.routeId } })
      if (!route) return NextResponse.json({ error: "Маршрут не найден" }, { status: 404 })
      if (!route.isActive) return NextResponse.json({ error: "Маршрут больше не доступен" }, { status: 400 })
      routeDistanceKm = route.distanceKm
      routeDurationMin = route.durationMin
      routeFromPoint = route.fromPoint
      routeToPoint = route.toPoint
      routePricePerBaggage = route.pricePerBaggage
    }

    const settings = await prisma.setting.findMany()
    const map: Record<string, string> = {}
    for (const s of settings) map[s.key] = s.value

    const pricePerKm = parseInt(map.pricePerKm || "25")
    const carClasses = JSON.parse(map.carClasses || "[]")
    const extraPassengerPrice = parseInt(map.extraPassengerPrice || "300")
    const nightCoefficient = parseFloat(map.nightCoefficient || "1.2")
    const nightHoursStart = parseInt(map.nightHoursStart || "23")
    const nightHoursEnd = parseInt(map.nightHoursEnd || "6")

    const selectedClass = carClasses.find((c: { id: string }) => c.id === data.carClass)
    const coefficient = selectedClass?.coefficient || 1.0

    let priceCalculated = Math.round(routeDistanceKm * pricePerKm * coefficient)
    if (data.passengers > 4) {
      priceCalculated += (data.passengers - 4) * extraPassengerPrice
    }
    if (data.baggageType === "1") priceCalculated += routePricePerBaggage
    if (data.baggageType === "2plus") priceCalculated += routePricePerBaggage * 2
    if (data.baggageType === "oversized") priceCalculated += routePricePerBaggage * 3
    if (data.datetime) {
      const hour = new Date(data.datetime).getHours()
      if (nightHoursStart > nightHoursEnd) {
        if (hour >= nightHoursStart || hour < nightHoursEnd) {
          priceCalculated = Math.round(priceCalculated * nightCoefficient)
        }
      } else {
        if (hour >= nightHoursStart && hour < nightHoursEnd) {
          priceCalculated = Math.round(priceCalculated * nightCoefficient)
        }
      }
    }

    const booking = await prisma.booking.create({
      data: {
        userId: dbUser.id,
        routeId,
        datetime: new Date(data.datetime),
        passengers: data.passengers,
        baggageType: data.baggageType,
        priceCalculated,
        carClass: data.carClass || null,
        notes: data.notes || null,
        status: "pending"
      },
      include: {
        route: { select: { fromPoint: true, toPoint: true } }
      }
    })

    await logBookingAudit({
      bookingId: booking.id,
      action: "created",
      newStatus: "pending",
      performedBy: dbUser.phone,
    })

    return NextResponse.json({ success: true, booking }, { status: 201 })
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
