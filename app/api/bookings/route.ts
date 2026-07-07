import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession( authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where = { userId: user.id, ...(status ? { status } : {}) }

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
    const session = await getServerSession( authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const data = await req.json()

    if (!data.routeId || !data.datetime || !data.passengers || !data.baggageType) {
      return NextResponse.json(
        { error: "Все поля обязательны" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      )
    }

    const route = await prisma.route.findUnique({
      where: { id: data.routeId }
    })

    if (!route) {
      return NextResponse.json(
        { error: "Маршрут не найден" },
        { status: 404 }
      )
    }

    if (!route.isActive) {
      return NextResponse.json(
        { error: "Маршрут больше не доступен" },
        { status: 400 }
      )
    }

    const baggageMultiplier: Record<string, number> = {
      none: 1,
      small: 1.1,
      medium: 1.2,
      large: 1.35,
    }
    const multiplier = baggageMultiplier[data.baggageType] || 1
    const priceCalculated = Math.round(route.priceBase * multiplier)

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        routeId: data.routeId,
        datetime: new Date(data.datetime),
        passengers: data.passengers,
        baggageType: data.baggageType,
        priceCalculated,
        status: "pending"
      },
      include: {
        route: { select: { fromPoint: true, toPoint: true } }
      }
    })

    return NextResponse.json({ success: true, booking }, { status: 201 })
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
