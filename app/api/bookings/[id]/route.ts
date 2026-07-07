import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession( authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        route: true,
        user: { select: { phone: true, name: true } }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Бронирование не найдено" },
        { status: 404 }
      )
    }

    if (booking.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Доступ запрещён" },
        { status: 403 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Get booking error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession( authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const { id } = await params
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

    const booking = await prisma.booking.findUnique({
      where: { id }
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Бронирование не найдено" },
        { status: 404 }
      )
    }

    if (booking.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Доступ запрещён" },
        { status: 403 }
      )
    }

    if (booking.status === "completed" || booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Невозможно изменить завершённое бронирование" },
        { status: 400 }
      )
    }

    const allowedUpdates = ["datetime", "passengers", "baggageType"]
    const updates: Record<string, unknown> = {}

    for (const field of allowedUpdates) {
      if (data[field] !== undefined) {
        updates[field] = field === "datetime" ? new Date(data[field]) : data[field]
      }
    }

    if (user.role === "admin") {
      if (data.status) updates.status = data.status
      if (data.driverName) updates.driverName = data.driverName
      if (data.driverPhone) updates.driverPhone = data.driverPhone
      if (data.carInfo) updates.carInfo = data.carInfo
      if (data.priceFinal) updates.priceFinal = data.priceFinal
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updates,
      include: {
        route: { select: { fromPoint: true, toPoint: true } }
      }
    })

    return NextResponse.json({ success: true, booking: updated })
  } catch (error) {
    console.error("Update booking error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession( authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id }
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Бронирование не найдено" },
        { status: 404 }
      )
    }

    if (booking.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Доступ запрещён" },
        { status: 403 }
      )
    }

    if (booking.status === "confirmed") {
      return NextResponse.json(
        { error: "Невозможно отменить подтверждённое бронирование. Свяжитесь с диспетчером." },
        { status: 400 }
      )
    }

    await prisma.booking.update({
      where: { id },
      data: { status: "cancelled" }
    })

    return NextResponse.json({ success: true, message: "Бронирование отменено" })
  } catch (error) {
    console.error("Delete booking error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
