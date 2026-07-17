import { NextResponse } from "next/server"
import { parseWebhook } from "@/lib/plusofon"
import { markVerified } from "@/lib/verification-store"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const payload = parseWebhook(body)

    if (!payload) {
      console.error("Invalid webhook payload:", body)
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    console.log(`Webhook received: phone=${payload.phone}, key=${payload.key}`)

    const marked = markVerified(payload.key)
    if (!marked) {
      console.warn(`Key not found or expired: ${payload.key}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Webhook error"
    console.error("Plusofon webhook error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
