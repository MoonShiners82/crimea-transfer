import { NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get("phone")

    if (!phone) {
      return NextResponse.json({ verified: false })
    }

    // »щем последний код дл€ этого телефона, созданный за последнюю минуту
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    
    const otp = await prisma.otpCode.findFirst({
      where: {
        phone,
        createdAt: { gte: oneMinuteAgo }
      },
      orderBy: { createdAt: "desc" }
    })

    if (otp) {
      return NextResponse.json({ 
        verified: true, 
        code: otp.code 
      })
    }

    return NextResponse.json({ verified: false })
  } catch (error) {
    return NextResponse.json({ verified: false })
  }
}

