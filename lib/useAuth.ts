"use client"

import { useState, useEffect, useCallback } from "react"

interface User {
  id: string
  phone: string
  name: string | null
  role: string
}

interface AuthState {
  user: User | null
  status: "loading" | "authenticated" | "unauthenticated"
}

export function useAuth(): AuthState & { signOut: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({ user: null, status: "loading" })

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setState({ user: data.user, status: "authenticated" })
        } else {
          setState({ user: null, status: "unauthenticated" })
        }
      })
      .catch(() => setState({ user: null, status: "unauthenticated" }))
  }, [])

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setState({ user: null, status: "unauthenticated" })
    window.location.href = "/"
  }, [])

  return { ...state, signOut }
}
