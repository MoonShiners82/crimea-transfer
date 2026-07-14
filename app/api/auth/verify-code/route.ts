import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, "")
  if (clean.startsWith("8")) clean = "7" + clean.slice(1)
  if (!clean.startsWith("7")) clean = "7" + clean
  return "+" + clean
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    console.log("[verify-code] Incoming phone:", phone)

    if (!phone) {
      return NextResponse.json({ error: "Phone required" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)
    // Also try without + prefix for compatibility
    const phoneWithoutPlus = normalizedPhone.startsWith("+") ? normalizedPhone.slice(1) : normalizedPhone
    const phoneWithPlus = normalizedPhone.startsWith("+") ? normalizedPhone : "+" + normalizedPhone

    console.log("[verify-code] Searching with phones:", normalizedPhone, phoneWithPlus, phoneWithoutPlus)

    // Check if webhook created a verification token for this phone
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        phone: { in: [normalizedPhone, phoneWithPlus, phoneWithoutPlus] },
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    })

    console.log("[verify-code] Token found:", verificationToken ? "YES" : "NO")
    if (verificationToken) {
      console.log("[verify-code] Token id:", verificationToken.id, "phone:", verificationToken.phone)
    }

    if (!verificationToken) {
      return NextResponse.json({ error: "pending" })
    }

    // Return token — do NOT mark as used here.
    // Token is marked used in NextAuth authorize() after successful signIn.
    return NextResponse.json({
      success: true,
      verificationToken: verificationToken.token,
    })
  } catch (error) {
    console.error("Verify code error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
