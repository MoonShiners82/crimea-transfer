import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { routeId, passengers, baggage, datetime } = await req.json()

    if (!routeId) {
      return NextResponse.json({ price: 0 })
    }

    const route = await prisma.route.findUnique({
      where: { id: routeId }
    })

    if (!route) {
      return NextResponse.json({ price: 0 })
    }

    let price = route.priceBase

    // Доплата за пассажиров сверх 4
    if (passengers > 4) {
      price += (passengers - 4) * 300
    }

    // Доплата за багаж
    if (baggage === "1") price += route.pricePerBaggage
    if (baggage === "2plus") price += route.pricePerBaggage * 2
    if (baggage === "oversized") price += route.pricePerBaggage * 3

    // Ночной коэффициент (23:00–06:00)
    if (datetime) {
      const hour = new Date(datetime).getHours()
      if (hour >= 23 || hour < 6) {
        price = Math.round(price * 1.2)
      }
    }

    return NextResponse.json({ price })
  } catch (error) {
    return NextResponse.json({ price: 0 })
  }
}
