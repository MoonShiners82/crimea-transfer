import { NextResponse } from "next/server"
import { markVerified } from "@/lib/verification-store"

export async function GET() {
  console.log("Plusofon webhook GET - health check")
  return NextResponse.json({ success: true })
}

export async function POST(req: Request) {
  const timestamp = new Date().toISOString()
  
  try {
    const contentType = req.headers.get("content-type") || ""
    let key: string | undefined
    let phone: string | undefined
    let rawBody: string

    if (contentType.includes("application/json")) {
      const body = await req.json()
      rawBody = JSON.stringify(body)
      key = body?.key as string | undefined
      phone = body?.phone as string | undefined
    } else {
      rawBody = await req.text()
      const params = new URLSearchParams(rawBody)
      key = params.get("key") || undefined
      phone = params.get("phone") || undefined
    }

    console.log(`[${timestamp}] WEBHOOK RECEIVED:`, rawBody)

    if (!key) {
      console.error(`[${timestamp}] No key in webhook. Raw:`, rawBody)
      return NextResponse.json({ success: false, error: "No key" }, { status: 400 })
    }

    const marked = await markVerified(key)
    if (!marked) {
      console.warn(`[${timestamp}] Key not found or expired: ${key}`)
    } else {
      console.log(`[${timestamp}] Key verified: ${key}, phone: ${phone}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Webhook error"
    console.error(`[${timestamp}] Webhook error:`, msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
