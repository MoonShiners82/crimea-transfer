import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { res } = requireRole(["admin", "dispatcher"])
    if (res) return res

    const drivers = await prisma.driver.findMany({
      where: { isActive: true, status: "approved" },
      select: { id: true, name: true, phone: true, carInfo: true },
      orderBy: { name: "asc" }
    })
    return NextResponse.json(drivers)
  } catch (error) {
    console.error("Get dispatcher drivers error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
