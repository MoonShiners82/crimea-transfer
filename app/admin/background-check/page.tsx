"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type CheckResult = {
  id: string
  hasRecord: boolean
  recordType: string | null
  details: string | null
  checkedAt: string
}

export default function BackgroundCheckPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [passportNumber, setPassportNumber] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [error, setError] = useState("")

  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/admin/background-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, passportNumber, birthDate })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Ошибка проверки")
        return
      }

      setResult(data)
    } catch (err) {
      setError("Ошибка сервера")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Проверка водителя</h1>
          <button
            onClick={() => router.push("/admin")}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Назад
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Проверка судимости</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ФИО</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Номер паспорта</label>
              <input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder="1234 567890"
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Дата рождения</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Проверка..." : "Проверить"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 border rounded">
              <h3 className="font-semibold mb-2">Результат проверки:</h3>
              <div className={`p-3 rounded ${result.hasRecord ? "bg-red-100" : "bg-green-100"}`}>
                <p className={`font-medium ${result.hasRecord ? "text-red-800" : "text-green-800"}`}>
                  {result.hasRecord ? "Есть судимость" : "Судимость не найдена"}
                </p>
                {result.recordType && (
                  <p className="text-sm mt-1">Тип: {result.recordType}</p>
                )}
                {result.details && (
                  <p className="text-sm mt-1">Детали: {result.details}</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Проверено: {new Date(result.checkedAt).toLocaleString("ru")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
