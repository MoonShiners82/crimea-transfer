import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { res } = requireRole("admin", req)
    if (res) return res

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
  } catch (error) {
    console.error("Get settings error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { res } = requireRole("admin", req)
    if (res) return res

    const data = await req.json()

    const updates: { key: string; value: string }[] = []
    if (data.pricePerKm !== undefined) updates.push({ key: "pricePerKm", value: String(data.pricePerKm) })
    if (data.carClasses !== undefined) updates.push({ key: "carClasses", value: JSON.stringify(data.carClasses) })
    if (data.extraPassengerPrice !== undefined) updates.push({ key: "extraPassengerPrice", value: String(data.extraPassengerPrice) })
    if (data.nightCoefficient !== undefined) updates.push({ key: "nightCoefficient", value: String(data.nightCoefficient) })
    if (data.nightHoursStart !== undefined) updates.push({ key: "nightHoursStart", value: String(data.nightHoursStart) })
    if (data.nightHoursEnd !== undefined) updates.push({ key: "nightHoursEnd", value: String(data.nightHoursEnd) })

    for (const u of updates) {
      await prisma.setting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Save settings error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
