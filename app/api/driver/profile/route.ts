import { NextResponse } from "next/server"
import { requireAuthWithDB } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { dbUser, res } = await requireAuthWithDB(req)
    if (res) return res

    const driver = await prisma.driver.findUnique({
      where: { userId: dbUser.id }
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
    const { dbUser, res } = await requireAuthWithDB(req)
    if (res) return res

    const driver = await prisma.driver.findUnique({
      where: { userId: dbUser.id }
    })

    if (!driver) {
      return NextResponse.json({ error: "Вы не зарегистрированы как водитель" }, { status: 404 })
    }

    const { name, phone, carInfo, licensePlate, photoUrl, carPhotoUrl, comments } = await req.json()

    const updated = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(carInfo && { carInfo }),
        ...(licensePlate !== undefined && { licensePlate }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(carPhotoUrl !== undefined && { carPhotoUrl }),
        ...(comments !== undefined && { comments })
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update driver profile error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
