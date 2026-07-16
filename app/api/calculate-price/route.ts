import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { routeId, passengers, baggage, datetime, carClass } = await req.json()

    if (!routeId) {
      return NextResponse.json({ price: 0 })
    }

    const route = await prisma.route.findUnique({
      where: { id: routeId }
    })

    if (!route) {
      return NextResponse.json({ price: 0 })
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

    const selectedClass = carClasses.find((c: { id: string }) => c.id === carClass)
    const coefficient = selectedClass?.coefficient || 1.0

    let price = Math.round(route.distanceKm * pricePerKm * coefficient)

    if (passengers > 4) {
      price += (passengers - 4) * extraPassengerPrice
    }

    if (baggage === "1") price += route.pricePerBaggage
    if (baggage === "2plus") price += route.pricePerBaggage * 2
    if (baggage === "oversized") price += route.pricePerBaggage * 3

    if (datetime) {
      const hour = new Date(datetime).getHours()
      if (nightHoursStart > nightHoursEnd) {
        if (hour >= nightHoursStart || hour < nightHoursEnd) {
          price = Math.round(price * nightCoefficient)
        }
      } else {
        if (hour >= nightHoursStart && hour < nightHoursEnd) {
          price = Math.round(price * nightCoefficient)
        }
      }
    }

    return NextResponse.json({ price })
  } catch {
    return NextResponse.json({ price: 0 })
  }
}
