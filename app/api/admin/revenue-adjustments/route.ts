import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { res } = requireRole("admin", req)
    if (res) return res

    const adjustments = await prisma.revenueAdjustment.findMany({
      orderBy: { date: "desc" },
    })
    return NextResponse.json(adjustments)
  } catch (error) {
    console.error("Get revenue adjustments error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { res, user } = requireRole("admin", req)
    if (res) return res

    const { amount, description, date } = await req.json()
    if (!amount || !description) {
      return NextResponse.json({ error: "Сумма и описание обязательны" }, { status: 400 })
    }

    const adjustment = await prisma.revenueAdjustment.create({
      data: {
        amount: parseInt(amount),
        description,
        date: date ? new Date(date) : new Date(),
        createdBy: user?.phone || null,
      },
    })
    return NextResponse.json(adjustment)
  } catch (error) {
    console.error("Create revenue adjustment error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { res } = requireRole("admin", req)
    if (res) return res

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    await prisma.revenueAdjustment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete revenue adjustment error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
