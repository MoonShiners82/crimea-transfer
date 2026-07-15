import { NextResponse } from "next/server"
import { removeTokenCookie } from "@/lib/jwt"

export async function POST() {
  await removeTokenCookie()
  return NextResponse.json({ success: true })
}
