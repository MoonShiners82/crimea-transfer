"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

export default function SignInPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [step, setStep] = useState<"phone" | "call">("phone")
  const [callTo, setCallTo] = useState("")
  const [requestId, setRequestId] = useState("")
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
      setRequestId(data.requestId)
      setStep("call")
      setMessage("Позвоните на указанный номер с вашего телефона")
    } catch {
      setError("Ошибка сервера")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = useCallback(async () => {
    if (!requestId) return
    setChecking(true)
    setError("")

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, requestId })
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
  }, [phone, requestId, router])

  useEffect(() => {
    if (step !== "call" || !requestId) return

    const interval = setInterval(handleVerify, 3000)
    return () => clearInterval(interval)
  }, [step, requestId, handleVerify])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в систему
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Подтверждение через звонок
          </p>
        </div>

        {step === "phone" ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Номер телефона
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Отправка..." : "Получить номер для звонка"}
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Позвоните на этот номер с вашего телефона:
              </p>
              <p className="text-3xl font-bold text-blue-600 tracking-wider">
                {callTo}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Звонок бесплатный. Код подтверждения не требуется.
              </p>
            </div>

            {message && <p className="text-sm text-green-600 text-center">{message}</p>}

            {checking && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-500">Ожидание звонка...</span>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={checking}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              Я позвонил, проверить
            </button>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep("phone")
                  setCallTo("")
                  setRequestId("")
                  setError("")
                  setMessage("")
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
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
                      setRequestId(data.requestId)
                      setMessage("Новый номер получен")
                    }
                  } catch {
                    setError("Ошибка сервера")
                  } finally {
                    setLoading(false)
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Получить новый номер
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {/* TEMPORARY: Dev login button - remove before production */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={async () => {
              if (!phone) {
                setError("Введите номер телефона")
                return
              }
              setLoading(true)
              setError("")
              try {
                const res = await fetch("/api/auth/dev-login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ phone })
                })
                const data = await res.json()
                if (!res.ok) {
                  setError(data.error || "Ошибка")
                  return
                }
                const signInResult = await signIn("credentials", {
                  phone: data.phone,
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
                setLoading(false)
              }
            }}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {loading ? "Вход..." : "Войти без SMS (тест)"}
          </button>
        </div>
      </div>
    </div>
  )
}
