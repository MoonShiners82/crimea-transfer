import { NextResponse } from "next/server"
import { removeTokenCookies } from "@/lib/jwt"

export async function POST() {
  await removeTokenCookies()
  return NextResponse.json({ success: true })
}
