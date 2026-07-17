import { NextResponse } from "next/server"
import { markVerified } from "@/lib/verification-store"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("Plusofon webhook received:", JSON.stringify(body))

    const key = body?.key as string | undefined
    if (!key) {
      console.error("No key in webhook payload:", body)
      return NextResponse.json({ error: "No key" }, { status: 400 })
    }

    const marked = await markVerified(key)
    if (!marked) {
      console.warn(`Key not found or expired: ${key}`)
    } else {
      console.log(`Key verified: ${key}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Webhook error"
    console.error("Plusofon webhook error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
