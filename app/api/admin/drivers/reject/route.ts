import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
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

    const { driverId } = await req.json()

    if (!driverId) {
      return NextResponse.json({ error: "ID водителя обязателен" }, { status: 400 })
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    })

    if (!driver) {
      return NextResponse.json({ error: "Водитель не найден" }, { status: 404 })
    }

    if (driver.status !== "pending") {
      return NextResponse.json({ error: "Заявка уже обработана" }, { status: 400 })
    }

    await prisma.driver.update({
      where: { id: driverId },
      data: { status: "rejected" }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reject driver error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
