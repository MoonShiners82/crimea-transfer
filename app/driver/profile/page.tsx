"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"

type DriverProfile = {
  id: string
  name: string
  phone: string
  carInfo: string
  status: string
  photoUrl: string | null
}

export default function DriverProfilePage() {
  const { user, status: authStatus } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [carInfo, setCarInfo] = useState("")
  const [licensePlate, setLicensePlate] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/auth/signin")
  }, [authStatus, router])

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchProfile()
    }
  }, [authStatus])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/driver/profile")
      if (res.status === 404) {
        router.push("/driver/register")
        return
      }
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setName(data.name)
        setPhone(data.phone)
        setCarInfo(data.carInfo)
        setLicensePlate(data.licensePlate || "")
        setPhoto(data.photoUrl)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

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
    setSuccess(false)
    setSaving(true)

    try {
      const res = await fetch("/api/driver/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, carInfo, licensePlate: licensePlate || undefined, photoUrl: photo })
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Ошибка")
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError("Ошибка сервера")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
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
              Профиль водителя
            </h1>
            <p className="text-[#8B7355]">
              Статус: <span className={`font-medium ${profile?.status === "approved" ? "text-green-600" : "text-yellow-600"}`}>
                {profile?.status === "approved" ? "Одобрен" : profile?.status === "rejected" ? "Отклонён" : "На рассмотрении"}
              </span>
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
              <p className="text-xs text-[#8B7355] mt-2">Нажмите для замены фото</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2332] mb-1">ФИО</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2332] mb-1">Телефон</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2332] mb-1">Автомобиль</label>
              <input
                type="text"
                required
                value={carInfo}
                onChange={(e) => setCarInfo(e.target.value)}
                className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2332] mb-1">Гос. номер</label>
              <input
                type="text"
                placeholder="А123БВ777"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">Профиль сохранён</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#E8A838] text-[#1A2332] py-3 rounded-lg font-semibold hover:bg-[#d49a30] transition disabled:opacity-50"
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/driver")}
                className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Назад
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
