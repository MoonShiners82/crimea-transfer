import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error("Get reviews error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
