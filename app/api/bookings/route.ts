import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
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

    // Находим пользователя в БД
    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      )
    }

    // Создаём бронь
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

    // В режиме разработки выводим код в консоль
    console.log(`✅ Заявка №${booking.id.slice(-6)} создана`)
    console.log(`   Маршрут: ${data.routeId}`)
    console.log(`   Дата: ${data.datetime}`)
    console.log(`   Пассажиры: ${data.passengers}`)
    console.log(`   Багаж: ${data.baggageType}`)
    console.log(`   Цена: ${data.priceCalculated} ₽`)

    // Здесь позже будет отправка SMS и MAX
    // await sendSms(user.phone, `Заявка №${booking.id.slice(-6)} принята`)
    // await sendMax(user.phone, booking)

    return NextResponse.json({
      success: true,
      bookingId: booking.id.slice(-6)
    })
  } catch (error) {
    console.error("Booking error:", error)
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    )
  }
}

