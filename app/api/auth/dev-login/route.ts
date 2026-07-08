import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// TEMPORARY: Remove before production!
export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: "Phone required" }, { status: 400 })
    }

    // Normalize phone
    let clean = phone.replace(/\D/g, "")
    if (clean.startsWith("8")) clean = "7" + clean.slice(1)
    if (!clean.startsWith("7")) clean = "7" + clean
    const normalizedPhone = "+" + clean

    // Create verification token directly
    const token = require("crypto").randomBytes(32).toString("hex")

    const verificationToken = await prisma.verificationToken.create({
      data: {
        id: require("crypto").randomBytes(16).toString("hex"),
        phone: normalizedPhone,
        token,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    })

    console.log(`[DEV LOGIN] Token created for ${normalizedPhone}`)

    return NextResponse.json({
      success: true,
      phone: normalizedPhone,
      verificationToken: verificationToken.token,
    })
  } catch (error) {
    console.error("Dev login error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
