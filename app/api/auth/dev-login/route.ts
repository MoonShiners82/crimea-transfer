import { NextResponse } from "next/server"

// Dev-login endpoint disabled for production.
// Authentication must go through the Plusofon reverse flash call flow.
export async function POST() {
  return NextResponse.json(
    { error: "Этот метод авторизации отключён" },
    { status: 403 }
  )
}
