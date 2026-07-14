import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { phone: session.user.phone as string } })
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

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
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { phone: session.user.phone as string } })
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

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
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { phone: session.user.phone as string } })
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

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
