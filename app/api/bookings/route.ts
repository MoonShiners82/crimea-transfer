import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const data = await req.json()

    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      )
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        routeId: data.routeId,
        datetime: new Date(data.datetime),
        passengers: data.passengers,
        baggageType: data.baggageType,
        priceCalculated: data.priceCalculated,
        status: "pending"
      }
    })

    console.log("Заявка создана:", booking.id)
    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    )
  }
}