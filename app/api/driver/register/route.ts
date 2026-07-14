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

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    const existingDriver = await prisma.driver.findUnique({
      where: { userId: user.id }
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
        userId: user.id,
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
