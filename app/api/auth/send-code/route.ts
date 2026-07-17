import { NextResponse } from "next/server"
import { requestCallback } from "@/lib/plusofon"
import { normalizePhone } from "@/lib/auth"
import { createVerification } from "@/lib/verification-store"

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: "Телефон обязателен" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)
    const hookUrl = process.env.PLUSOFON_HOOK_URL || `${new URL(req.url).origin}/api/auth/plusofon-webhook`

    const result = await requestCallback(normalizedPhone, hookUrl)

    await createVerification(result.key, normalizedPhone)

    console.log(`CallToAuth requested for ${normalizedPhone}, key: ${result.key}, callTo: ${result.phone}`)

    return NextResponse.json({
      success: true,
      message: "Вам будет показан номер для звонка. Позвоните на него с вашего телефона для подтверждения.",
      key: result.key,
      callTo: result.phone,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Ошибка отправки запроса"
    console.error("Send code error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
