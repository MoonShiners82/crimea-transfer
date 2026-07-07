import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { fullName, passportNumber, birthDate } = await req.json()

  if (!fullName || !passportNumber || !birthDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const token = process.env.CRIMINAL_CHECK_API_TOKEN
  if (!token) {
    return NextResponse.json({ error: "API token not configured" }, { status: 500 })
  }

  try {
    const response = await fetch("https://api.example.com/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        full_name: fullName,
        passport_number: passportNumber,
        birth_date: birthDate
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: "External API error" }, { status: 502 })
    }

    const data = await response.json()

    const check = await prisma.backgroundCheck.create({
      data: {
        fullName,
        passportNumber,
        birthDate,
        hasRecord: data.has_record,
        recordType: data.record_type || null,
        details: data.details || null,
        checkedBy: (session.user as any).id
      }
    })

    return NextResponse.json({
      id: check.id,
      hasRecord: data.has_record,
      recordType: data.record_type,
      details: data.details,
      checkedAt: check.checkedAt
    })
  } catch (error) {
    console.error("Background check error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
