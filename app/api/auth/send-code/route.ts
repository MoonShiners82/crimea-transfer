import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json(
        { error: "Телефон обязателен" },
        { status: 400 }
      )
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.otpCode.create({
      data: { phone, code, expiresAt }
    })

    const token = process.env.GREENSMS_TOKEN
    const isTestMode = !token || token === "your_greensms_token_here"

    if (isTestMode) {
      console.log("=".repeat(50))
      console.log("🧪 ТЕСТОВЫЙ РЕЖИМ — SMS не отправлено")
      console.log("📱 Телефон: " + phone)
      console.log("🔑 Код для " + phone + ": " + code)
      console.log("=".repeat(50))

      return NextResponse.json({
        success: true,
        testMode: true,
        message: "Тестовый режим. Код: " + code
      })
    }

    try {
      const https = require('https')
      const agent = new https.Agent({ rejectUnauthorized: false })

      const response = await fetch("https://api.greensms.ru/sms/send", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: phone,
          text: "Код подтверждения: " + code + ". Действует 5 минут."
        }),
        // @ts-ignore
        agent
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("GreenSMS error:", errorText)
        return NextResponse.json(
          { error: "Не удалось отправить SMS" },
          { status: 500 }
        )
      }

      console.log("✅ SMS отправлено на " + phone)
      console.log("🔑 Код для " + phone + ": " + code)

      return NextResponse.json({ success: true })
    } catch (smsError) {
      console.error("SMS error:", smsError)
      return NextResponse.json(
        { error: "Ошибка отправки SMS" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Send code error:", error)
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    )
  }
}
