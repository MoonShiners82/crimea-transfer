import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

export async function POST(req: Request) {
  try {
    console.log("[webhook] === INCOMING WEBHOOK ===")
    console.log("[webhook] URL:", req.url)
    console.log("[webhook] Method:", req.method)

    const contentType = req.headers.get("content-type") || ""
    console.log("[webhook] Content-Type:", contentType)

    const rawBody = await req.text()
    console.log("[webhook] Raw body:", rawBody)

    let body: Record<string, string> = {}

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(rawBody)
      params.forEach((value, key) => { body[key] = value })
    } else {
      try {
        body = JSON.parse(rawBody)
      } catch {
        console.log("[webhook] Failed to parse body as JSON or form-urlencoded")
        return NextResponse.json({ success: true })
      }
    }

    console.log("[webhook] Parsed body:", JSON.stringify(body))
    console.log("[webhook] phone:", body.phone)
    console.log("[webhook] key:", body.key)

    const phone = body.phone || body.number_a || body.caller
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
