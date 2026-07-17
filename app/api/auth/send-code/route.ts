import { NextResponse } from "next/server"
import { sendFlashCall, generatePin } from "@/lib/plusofon"
import { normalizePhone } from "@/lib/auth"
import { createVerification } from "@/lib/verification-store"

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: "Телефон обязателен" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)
    const pin = generatePin()

    const result = await sendFlashCall(normalizedPhone, pin)

    await createVerification(result.key, normalizedPhone, pin)

    console.log(`Flash call sent to ${normalizedPhone}, key: ${result.key}`)

    return NextResponse.json({
      success: true,
      message: "Вам поступит звонок. Ответьте и запомните последние 4 цифры номера.",
      key: result.key,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Ошибка отправки запроса"
    console.error("Send code error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
