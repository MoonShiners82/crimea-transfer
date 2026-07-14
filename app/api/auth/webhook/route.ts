import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

export async function POST(req: Request) {
  try {
    // Log everything — headers, URL, full body
    console.log("[webhook] === INCOMING WEBHOOK ===")
    console.log("[webhook] URL:", req.url)
    console.log("[webhook] Method:", req.method)
    console.log("[webhook] Headers:", JSON.stringify(Object.fromEntries(req.headers.entries())))

    const rawBody = await req.text()
    console.log("[webhook] Raw body:", rawBody)

    let body: Record<string, unknown>
    try {
      body = JSON.parse(rawBody)
    } catch {
      console.log("[webhook] Failed to parse JSON body")
      return NextResponse.json({ success: true })
    }

    console.log("[webhook] Parsed body keys:", Object.keys(body).join(", "))
    console.log("[webhook] Full body:", JSON.stringify(body, null, 2))

    // Log every possible phone field
    console.log("[webhook] body.phone:", body.phone)
    console.log("[webhook] body.number_a:", body.number_a)
    console.log("[webhook] body.caller:", body.caller)
    console.log("[webhook] body.caller_number:", body.caller_number)
    console.log("[webhook] body.from:", body.from)
    console.log("[webhook] body.key:", body.key)
    console.log("[webhook] body.status:", body.status)

    // Try all known phone field names
    const phone = body.phone || body.number_a || body.caller || body.caller_number || body.from
    const key = body.key

    if (!phone) {
      console.log("Webhook: no phone in payload")
      return NextResponse.json({ success: true })
    }

    // Normalize phone
    let clean = String(phone).replace(/\D/g, "")
    if (clean.startsWith("8")) clean = "7" + clean.slice(1)
    if (!clean.startsWith("7")) clean = "7" + clean
    const normalizedPhone = "+" + clean

    // Create verification token
    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.verificationToken.create({
      data: {
        phone: normalizedPhone,
        token,
        expiresAt,
        isUsed: false,
      }
    })

    console.log(`Webhook: token created for ${normalizedPhone}, key: ${key}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ success: true })
  }
}
