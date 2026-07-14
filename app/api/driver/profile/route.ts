import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
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

    const driver = await prisma.driver.findUnique({
      where: { userId: user.id }
    })

    if (!driver) {
      return NextResponse.json({ error: "Вы не зарегистрированы как водитель" }, { status: 404 })
    }

    return NextResponse.json(driver)
  } catch (error) {
    console.error("Get driver profile error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
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

    const driver = await prisma.driver.findUnique({
      where: { userId: user.id }
    })

    if (!driver) {
      return NextResponse.json({ error: "Вы не зарегистрированы как водитель" }, { status: 404 })
    }

    const { name, phone, carInfo, photoUrl } = await req.json()

    const updated = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(carInfo && { carInfo }),
        ...(photoUrl !== undefined && { photoUrl })
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update driver profile error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
