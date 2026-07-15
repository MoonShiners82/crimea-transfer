"use client"

import { useState, useEffect, useCallback, useRef } from "react"

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

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" })
      return res.ok
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

let interceptorInstalled = false

function installInterceptor() {
  if (interceptorInstalled) return
  interceptorInstalled = true

  const originalFetch = window.fetch
  window.fetch = async function (input, init) {
    const res = await originalFetch.call(this, input, init)

    if (res.status === 401 && !res.url.includes("/api/auth/")) {
      const refreshed = await tryRefresh()
      if (refreshed) {
        return originalFetch.call(this, input, init)
      }
    }

    return res
  }
}

export function useAuth(): AuthState & { signOut: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({ user: null, status: "loading" })
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    installInterceptor()

    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setState({ user: data.user, status: "authenticated" })
          startRefreshTimer()
        } else {
          setState({ user: null, status: "unauthenticated" })
        }
      })
      .catch(() => setState({ user: null, status: "unauthenticated" }))

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [])

  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    const REFRESH_INTERVAL = 14 * 60 * 1000
    refreshTimerRef.current = setInterval(async () => {
      const ok = await tryRefresh()
      if (!ok) {
        setState({ user: null, status: "unauthenticated" })
        if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      }
    }, REFRESH_INTERVAL)
  }, [])

  const signOut = useCallback(async () => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    await fetch("/api/auth/logout", { method: "POST" })
    setState({ user: null, status: "unauthenticated" })
    window.location.href = "/"
  }, [])

  return { ...state, signOut }
}
