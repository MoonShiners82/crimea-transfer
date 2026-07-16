"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"

export default function DriverRegisterPage() {
  const { user, status: authStatus } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [carInfo, setCarInfo] = useState("")
  const [licensePlate, setLicensePlate] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/auth/staff-login")
    if (user?.phone) setPhone(user.phone)
  }, [authStatus, user, router])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError("Файл слишком большой (максимум 5 МБ)")
      return
    }

    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/driver/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, carInfo, licensePlate: licensePlate || undefined, photoUrl: photo })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Ошибка")
        return
      }

      router.push("/driver")
    } catch {
      setError("Ошибка сервера")
    } finally {
      setLoading(false)
    }
  }

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0EB]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A8F] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg p-8 border border-[#B8D4E3]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1A2332] mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Стать водителем
            </h1>
            <p className="text-[#8B7355]">
              Заполните форму для регистрации
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo */}
            <div className="text-center">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-24 h-24 mx-auto rounded-full border-2 border-dashed border-[#B8D4E3] flex items-center justify-center cursor-pointer hover:border-[#2D6A8F] transition overflow-hidden"
              >
                {photo ? (
                  <img src={photo} alt="Фото" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#8B7355] text-3xl">📷</span>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <p className="text-xs text-[#8B7355] mt-2">Нажмите для загрузки фото</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2332] mb-1">ФИО *</label>
              <input
                type="text"
                required
                placeholder="Иванов Иван Иванович"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2332] mb-1">Телефон *</label>
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
              <label className="block text-sm font-medium text-[#1A2332] mb-1">Автомобиль *</label>
              <input
                type="text"
                required
                placeholder="Toyota Camry, белый"
                value={carInfo}
                onChange={(e) => setCarInfo(e.target.value)}
                className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2332] mb-1">Гос. номер <span className="text-[#8B7355]">(необязательно)</span></label>
              <input
                type="text"
                placeholder="А123БВ777"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8A838] text-[#1A2332] py-3 rounded-lg font-semibold hover:bg-[#d49a30] transition disabled:opacity-50"
            >
              {loading ? "Отправка..." : "Отправить заявку"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
