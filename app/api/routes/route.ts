import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const routes = await prisma.route.findMany({
    where: { isActive: true },
    orderBy: { fromPoint: "asc" }
  })

  return NextResponse.json(routes)
}