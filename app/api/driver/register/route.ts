import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { dbUser, res } = await requireAuth()
    if (res) return res

    const existingDriver = await prisma.driver.findUnique({
      where: { userId: dbUser.id }
    })

    if (existingDriver) {
      return NextResponse.json({ error: "Вы уже зарегистрированы как водитель" }, { status: 400 })
    }

    const { name, phone, carInfo, photoUrl } = await req.json()

    if (!name || !phone || !carInfo) {
      return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 })
    }

    const driver = await prisma.driver.create({
      data: {
        userId: dbUser.id,
        name,
        phone,
        carInfo,
        photoUrl: photoUrl || null,
        status: "pending"
      }
    })

    return NextResponse.json({ success: true, driver })
  } catch (error) {
    console.error("Driver register error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
