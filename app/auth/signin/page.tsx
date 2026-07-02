"use client"

import { useState, useEffect, useRef } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function SignIn() {
  const [phone, setPhone] = useState("")
  const [step, setStep] = useState<"phone" | "waiting">("phone")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const CALLBACK_PHONE = "+79380961205"

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setStep("waiting")

    // Запускаем опрос каждые 2 секунды
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/callback-status?phone=${encodeURIComponent(phone)}`)
        const data = await res.json()

        if (data.verified) {
          clearInterval(pollRef.current!)
          const result = await signIn("credentials", {
            phone,
            code: data.code,
            redirect: false
          })

          if (result?.error) {
            setError("Ошибка входа")
            setStep("phone")
          } else {
            router.push("/booking")
          }
        }
      } catch (err) {
        console.error("Polling error:", err)
      }
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Вход в систему</h1>
        <p className="text-center text-gray-600 mb-6">Авторизация по звонку</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
        )}

        {step === "phone" && (
          <form onSubmit={handleSendCode}>
            <label className="block text-sm font-medium mb-2">Номер телефона</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className="w-full p-3 border rounded mb-4"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Ожидание..." : "Получить код"}
            </button>
          </form>
        )}

        {step === "waiting" && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium mb-2">Ожидаем вашего звонка...</p>
            <p className="text-gray-600 mb-4">
              Пожалуйста, позвоните на номер:<br/>
              <a href={`tel:${CALLBACK_PHONE}`} className="text-blue-600 font-bold text-xl">
                {CALLBACK_PHONE}
              </a>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Звонок бесплатный. Можно сбросить через 3 секунды.
            </p>
            <button
              type="button"
              onClick={() => {
                if (pollRef.current) clearInterval(pollRef.current)
                setStep("phone")
              }}
              className="text-blue-600 hover:underline"
            >
              Отмена
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
