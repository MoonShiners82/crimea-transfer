import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("Plusofon webhook:", JSON.stringify(body))

    // Plusofon sends: phone, key, and possibly other fields
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
