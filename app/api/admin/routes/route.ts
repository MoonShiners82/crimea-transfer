import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { res } = requireRole(["admin", "dispatcher"], req)
    if (res) return res

    const routes = await prisma.route.findMany({
      orderBy: { fromPoint: "asc" },
    })

    return NextResponse.json(routes)
  } catch (error) {
    console.error("Get routes error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { res } = requireRole("admin", req)
    if (res) return res

    const { fromPoint, toPoint, distanceKm, durationMin, pricePerBaggage, isActive } = await req.json()
    if (!fromPoint || !toPoint || !distanceKm) {
      return NextResponse.json({ error: "Обязательные поля: откуда, куда, километраж" }, { status: 400 })
    }

    const route = await prisma.route.create({
      data: {
        fromPoint,
        toPoint,
        distanceKm: parseInt(distanceKm),
        durationMin: parseInt(durationMin) || Math.round(parseInt(distanceKm) * 1.5),
        priceBase: 0,
        pricePerBaggage: parseInt(pricePerBaggage) || 200,
        isActive: isActive !== false,
      }
    })

    return NextResponse.json(route, { status: 201 })
  } catch (error) {
    console.error("Create route error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { res } = requireRole("admin", req)
    if (res) return res

    const { id, fromPoint, toPoint, distanceKm, durationMin, pricePerBaggage, isActive } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "ID маршрута обязателен" }, { status: 400 })
    }

    const route = await prisma.route.update({
      where: { id },
      data: {
        ...(fromPoint !== undefined && { fromPoint }),
        ...(toPoint !== undefined && { toPoint }),
        ...(distanceKm !== undefined && { distanceKm: parseInt(distanceKm) }),
        ...(durationMin !== undefined && { durationMin: parseInt(durationMin) }),
        ...(pricePerBaggage !== undefined && { pricePerBaggage: parseInt(pricePerBaggage) }),
        ...(isActive !== undefined && { isActive }),
      }
    })

    return NextResponse.json(route)
  } catch (error) {
    console.error("Update route error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { res } = requireRole("admin", req)
    if (res) return res

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID обязателен" }, { status: 400 })

    const bookingsCount = await prisma.booking.count({ where: { routeId: id } })
    if (bookingsCount > 0) {
      return NextResponse.json({ error: "Нельзя удалить маршрут с существующими заявками. Деактивируйте его вместо этого." }, { status: 400 })
    }

    await prisma.route.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete route error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
