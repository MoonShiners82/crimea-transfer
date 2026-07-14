"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"

export default function StaffLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        phone,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Неверный телефон или пароль")
        return
      }

      // Redirect based on role — we need to fetch session
      const res = await fetch("/api/auth/session")
      const session = await res.json()

      if (session?.user?.role === "dispatcher") {
        router.push("/dispatcher")
      } else if (session?.user?.role === "driver") {
        router.push("/driver")
      } else if (session?.user?.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/")
      }
      router.refresh()
    } catch {
      setError("Ошибка сервера")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A2332] via-[#2D6A8F] to-[#B8D4E3] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-[#F5F0EB] rounded-lg p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1A2332] mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Вход для сотрудников
          </h1>
          <p className="text-[#8B7355]">
            Диспетчеры и водители
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A2332] mb-1">
              Номер телефона
            </label>
            <input
              type="tel"
              required
              placeholder="+7 (___) ___-__-__"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A2332] mb-1">
              Пароль
            </label>
            <input
              type="password"
              required
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E8A838] text-[#1A2332] py-3 rounded-lg font-semibold hover:bg-[#d49a30] transition disabled:opacity-50"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/signin" className="text-sm text-[#2D6A8F] hover:text-[#1A2332]">
            Вход для клиентов (по звонку)
          </Link>
        </div>
      </div>
    </div>
  )
}
