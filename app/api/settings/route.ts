import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const settings = await prisma.setting.findMany()
    const map: Record<string, string> = {}
    for (const s of settings) map[s.key] = s.value

    return NextResponse.json({
      pricePerKm: parseInt(map.pricePerKm || "25"),
      carClasses: JSON.parse(map.carClasses || "[]"),
      extraPassengerPrice: parseInt(map.extraPassengerPrice || "300"),
      nightCoefficient: parseFloat(map.nightCoefficient || "1.2"),
      nightHoursStart: parseInt(map.nightHoursStart || "23"),
      nightHoursEnd: parseInt(map.nightHoursEnd || "6"),
    })
  } catch {
    return NextResponse.json({
      pricePerKm: 25,
      carClasses: [
        { id: "economy", name: "Эконом", coefficient: 0.8 },
        { id: "comfort", name: "Комфорт", coefficient: 1.0 },
        { id: "comfort_plus", name: "Комфорт+", coefficient: 1.2 },
        { id: "business", name: "Бизнес", coefficient: 1.4 },
        { id: "minibus", name: "Микроавтобус", coefficient: 1.6 },
      ],
      extraPassengerPrice: 300,
      nightCoefficient: 1.2,
      nightHoursStart: 23,
      nightHoursEnd: 6,
    })
  }
}
