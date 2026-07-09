import { NextResponse } from "next/server"
import { requestReverseFlashCall } from "@/lib/plusofon"

function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, "")
  if (clean.startsWith("8")) clean = "7" + clean.slice(1)
  if (!clean.startsWith("7")) clean = "7" + clean
  return "+" + clean
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: "Телефон обязателен" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)
    const webhookUrl = `${process.env.NEXTAUTH_URL || "https://crimea-tcr.vercel.app"}/api/auth/webhook`

    const result = await requestReverseFlashCall(normalizedPhone, webhookUrl)

    console.log(`Reverse Flash Call for ${normalizedPhone}, call to: ${result.phone}`)

    return NextResponse.json({
      success: true,
      message: "Позвоните на указанный номер для подтверждения",
      callTo: result.phone,
      key: result.key,
    })
  } catch (error) {
    console.error("Send code error:", error)
    return NextResponse.json(
      { error: "Ошибка отправки кода. Попробуйте позже." },
      { status: 500 }
    )
  }
}
