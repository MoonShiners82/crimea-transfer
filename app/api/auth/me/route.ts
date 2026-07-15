import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/jwt"

export async function GET() {
  const token = await getCurrentUser()
  if (!token) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({ user: token })
}
