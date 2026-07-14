import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { res } = await requireRole(["admin", "dispatcher"])
    if (res) return res

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const where = status ? { status } : {}
    const drivers = await prisma.driver.findMany({ where, orderBy: { createdAt: "desc" } })
    return NextResponse.json(drivers)
  } catch (error) {
    console.error("Get drivers error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { res } = await requireRole("admin")
    if (res) return res

    const { name, phone, carInfo } = await req.json()
    if (!name || !phone) return NextResponse.json({ error: "Name and phone required" }, { status: 400 })

    const driver = await prisma.driver.create({ data: { name, phone, carInfo: carInfo || "" } })
    return NextResponse.json(driver)
  } catch (error) {
    console.error("Create driver error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { res } = await requireRole("admin")
    if (res) return res

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    await prisma.driver.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete driver error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
