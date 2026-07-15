"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"

interface RouteGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function RouteGuard({ allowedRoles, children, fallback }: RouteGuardProps) {
  const { user, status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/staff-login")
      return
    }

    if (user && !allowedRoles.includes(user.role)) {
      router.push("/")
    }
  }, [status, user, allowedRoles, router])

  if (status === "loading") {
    return fallback ?? (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0EB]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A8F] border-t-transparent"></div>
      </div>
    )
  }

  if (status === "unauthenticated" || (user && !allowedRoles.includes(user.role))) {
    return null
  }

  return <>{children}</>
}
