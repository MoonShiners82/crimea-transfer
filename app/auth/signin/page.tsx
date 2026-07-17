"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/auth/login")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A2332] via-[#2D6A8F] to-[#B8D4E3] flex items-center justify-center">
      <p className="text-white">Перенаправление...</p>
    </div>
  )
}
