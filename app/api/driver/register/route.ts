import { NextResponse } from "next/server"
import { requireAuthWithDB } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { dbUser, res } = await requireAuthWithDB(req)
    if (res) return res

    const existingDriver = await prisma.driver.findUnique({
      where: { userId: dbUser.id }
    })

    if (existingDriver) {
      return NextResponse.json({ error: "Вы уже зарегистрированы как водитель" }, { status: 400 })
    }

    const { name, phone, carInfo, licensePlate, photoUrl, carPhotoUrl, comments } = await req.json()

    if (!name || !phone || !carInfo) {
      return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 })
    }

    const driver = await prisma.driver.create({
      data: {
        userId: dbUser.id,
        name,
        phone,
        carInfo,
        licensePlate: licensePlate || null,
        photoUrl: photoUrl || null,
        carPhotoUrl: carPhotoUrl || null,
        comments: comments || null,
        status: "pending"
      }
    })

    return NextResponse.json({ success: true, driver })
  } catch (error) {
    console.error("Driver register error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
