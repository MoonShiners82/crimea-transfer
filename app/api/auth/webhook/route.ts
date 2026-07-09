import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("Plusofon webhook received:", JSON.stringify(body))

    const { phone, key, status } = body

    if (!phone || !key) {
      return NextResponse.json({ error: "Missing phone or key" }, { status: 400 })
    }

    // Normalize phone
    let clean = phone.replace(/\D/g, "")
    if (clean.startsWith("8")) clean = "7" + clean.slice(1)
    if (!clean.startsWith("7")) clean = "7" + clean
    const normalizedPhone = "+" + clean

    if (status === "verified" || status === "success") {
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

      console.log(`Webhook: verification token created for ${normalizedPhone}`)

      return NextResponse.json({ success: true, token })
    }

    return NextResponse.json({ success: true, message: "Webhook received" })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
