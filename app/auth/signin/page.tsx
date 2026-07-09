"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

export default function SignInPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [step, setStep] = useState<"phone" | "call">("phone")
  const [callTo, setCallTo] = useState("")
  const [authKey, setAuthKey] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Ошибка")
        return
      }

      setCallTo(data.callTo)
      setAuthKey(data.key)
      setStep("call")
      setMessage("Позвоните на указанный номер с вашего телефона")
    } catch {
      setError("Ошибка сервера")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = useCallback(async () => {
    if (!authKey) return
    setChecking(true)
    setError("")

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, key: authKey })
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error?.includes("ещё не поступил")) {
          return
        }
        setError(data.error || "Ошибка")
        return
      }

      const signInResult = await signIn("credentials", {
        phone,
        verificationToken: data.verificationToken,
        redirect: false,
      })

      if (signInResult?.error) {
        setError("Ошибка авторизации")
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("Ошибка сервера")
    } finally {
      setChecking(false)
    }
  }, [phone, authKey, router])

  useEffect(() => {
    if (step !== "call" || !authKey) return

    const interval = setInterval(handleVerify, 3000)
    return () => clearInterval(interval)
  }, [step, authKey, handleVerify])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A2332] via-[#2D6A8F] to-[#B8D4E3] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-[#F5F0EB] rounded-lg p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1A2332] mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Вход в систему
          </h1>
          <p className="text-[#8B7355]">
            Подтверждение через звонок
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8A838] text-[#1A2332] py-3 rounded-lg font-semibold hover:bg-[#d49a30] transition disabled:opacity-50"
            >
              {loading ? "Отправка..." : "Получить номер для звонка"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-[#8B7355] mb-2">
                Позвоните на этот номер:
              </p>
              <p className="text-4xl font-bold text-[#1A2332] tracking-wider">
                {callTo}
              </p>
              <p className="text-sm text-[#8B7355] mt-2">
                Звонок бесплатный. Код подтверждения не требуется.
              </p>
            </div>

            {message && <p className="text-sm text-[#2D6A8F] text-center">{message}</p>}

            {checking && (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#2D6A8F] border-t-transparent"></div>
                <span className="text-sm text-[#8B7355]">Ожидание звонка...</span>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={checking}
              className="w-full bg-[#2D6A8F] text-white py-3 rounded-lg font-semibold hover:bg-[#245a7a] transition disabled:opacity-50"
            >
              Я позвонил, проверить
            </button>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep("phone")
                  setCallTo("")
                  setAuthKey("")
                  setError("")
                  setMessage("")
                }}
                className="text-sm text-[#8B7355] hover:text-[#1A2332]"
              >
                Изменить номер
              </button>
              <button
                type="button"
                onClick={async () => {
                  setError("")
                  setMessage("")
                  setLoading(true)
                  try {
                    const res = await fetch("/api/auth/send-code", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ phone })
                    })
                    const data = await res.json()
                    if (!res.ok) {
                      setError(data.error || "Ошибка")
                    } else {
                      setCallTo(data.callTo)
                      setAuthKey(data.key)
                      setMessage("Новый номер получен")
                    }
                  } catch {
                    setError("Ошибка сервера")
                  } finally {
                    setLoading(false)
                  }
                }}
                className="text-sm text-[#2D6A8F] hover:text-[#1A2332]"
              >
                Получить новый номер
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 text-center mt-4">{error}</p>}
      </div>
    </div>
  )
}
