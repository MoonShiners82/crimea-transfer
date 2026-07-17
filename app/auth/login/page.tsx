"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Step = "phone" | "code"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  const handleSendCall = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/flashcall/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Ошибка отправки звонка")
        return
      }

      setStep("code")
      setCountdown(30)
    } catch {
      setError("Ошибка сервера")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/flashcall/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin: code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Неверный код")
        return
      }

      router.push("/booking")
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
            Вход
          </h1>
          <p className="text-[#8B7355]">
            Мы позвоним вам для подтверждения
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendCall} className="space-y-4">
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

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8A838] text-[#1A2332] py-3 rounded-lg font-semibold hover:bg-[#d49a30] transition disabled:opacity-50"
            >
              {loading ? "Отправка..." : "Получить звонок"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A2332] mb-1">
                Код из звонка (последние 4 цифры)
              </label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="____"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || code.length < 4}
              className="w-full bg-[#E8A838] text-[#1A2332] py-3 rounded-lg font-semibold hover:bg-[#d49a30] transition disabled:opacity-50"
            >
              {loading ? "Проверка..." : "Подтвердить"}
            </button>

            {countdown > 0 ? (
              <p className="text-center text-sm text-[#8B7355]">
                Повторный запрос через {countdown} сек
              </p>
            ) : (
              <button
                type="button"
                onClick={() => { setStep("phone"); setError("") }}
                className="w-full text-[#2D6A8F] text-sm hover:underline"
              >
                Изменить номер
              </button>
            )}
          </form>
        )}

        <div className="mt-6 text-center space-y-2">
          <Link href="/" className="text-xs text-[#8B7355] hover:text-[#1A2332] transition">
            На главную
          </Link>
          <span className="text-[#B8D4E3]">|</span>
          <Link href="/auth/staff-login" className="text-xs text-[#8B7355] hover:text-[#1A2332] transition">
            Вход для сотрудников
          </Link>
        </div>
      </div>
    </div>
  )
}
