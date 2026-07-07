import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: "Телефон обязателен" }, { status: 400 })
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString()

    await prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }
    })

    console.log("Код создан:", { phone, code })

    return NextResponse.json({ success: true, message: "Код создан (тестовый режим)" })
  } catch (error) {
    console.error("Send code error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}