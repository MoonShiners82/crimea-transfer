import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
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

    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Доступ запрещён" },
        { status: 403 }
      )
    }

    const { bookingId, driverName, driverPhone, carInfo, priceFinal } = await req.json()

    if (!bookingId || !driverName || !driverPhone || !carInfo || !priceFinal) {
      return NextResponse.json(
        { error: "Все поля обязательны" },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "confirmed",
        driverName,
        driverPhone,
        carInfo,
        priceFinal,
        confirmedAt: new Date()
      },
      include: {
        user: {
          select: {
            phone: true
          }
        },
        route: {
          select: {
            fromPoint: true,
            toPoint: true
          }
        }
      }
    })

    const token = process.env.GREENSMS_TOKEN
    if (token && token !== "your_greensms_token_here") {
      try {
        const https = require('https')
        const agent = new https.Agent({ rejectUnauthorized: false })

        const smsText = `Бронь N${booking.id.slice(-6)} подтверждена! Водитель: ${driverName}, тел: ${driverPhone}, авто: ${carInfo}, стоимость: ${priceFinal} руб.`

        await fetch("https://api.greensms.ru/sms/send", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            to: booking.user.phone,
            text: smsText
          }),
          // @ts-ignore
          agent
        })

        console.log("? SMS отправлено клиенту " + booking.user.phone)
      } catch (smsError) {
        console.error("SMS error:", smsError)
      }
    }

    console.log("? Заявка N" + booking.id.slice(-6) + " подтверждена")

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error("Confirm booking error:", error)
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    )
  }
}

