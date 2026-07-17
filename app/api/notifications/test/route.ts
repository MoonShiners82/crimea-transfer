import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { sendTestNotification } from "@/lib/notifications"

export async function POST(req: Request) {
  try {
    const { res } = requireRole(["admin"], req)
    if (res) return res

    const { type, recipient } = await req.json()

    if (!type || !recipient) {
      return NextResponse.json({ error: "type и recipient обязательны" }, { status: 400 })
    }

    const allowedTypes = ["sms", "email", "telegram"]
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: "type должен быть sms, email или telegram" }, { status: 400 })
    }

    const success = await sendTestNotification(type, recipient)

    return NextResponse.json({
      success,
      message: success ? "Уведомление отправлено" : "Не удалось отправить уведомление"
    })
  } catch (error) {
    console.error("Test notification error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
