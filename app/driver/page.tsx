"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "../components/Toast"
import { useAuth } from "@/lib/useAuth"
import { Skeleton, CardSkeleton } from "../components/Skeleton"

type Booking = {
  id: string
  datetime: string
  passengers: number
  baggageType: string
  priceCalculated: number
  priceFinal: number | null
  status: string
  driverName: string | null
  driverPhone: string | null
  carInfo: string | null
  carClass: string | null
  cancelReason: string | null
  user: { phone: string; name: string | null }
  route: { fromPoint: string; toPoint: string; distanceKm: number; durationMin: number }
}

type DriverProfile = {
  id: string
  name: string
  phone: string
  carInfo: string
  status: string
  photoUrl: string | null
  carPhotoUrl: string | null
  licensePlate: string | null
}

const statusColors: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
}

const statusText: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждена",
  in_progress: "В пути",
  completed: "Завершена",
  cancelled: "Отменена",
}

export default function DriverPage() {
  const { user, status: authStatus } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/auth/staff-login")
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
      if (!res.ok) {
        setError("Не удалось загрузить профиль водителя")
        setLoading(false)
        return
      }
      const data = await res.json()
      setProfile(data)
      if (data.status === "approved") {
        fetchBookings()
      } else {
        setLoading(false)
      }
    } catch (e) {
      console.error(e)
      setError("Ошибка загрузки данных")
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/driver/bookings")
      if (res.ok) {
        setBookings(await res.json())
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleStatus = async (bookingId: string, newStatus: string) => {
    const label = newStatus === "in_progress" ? "начать поездку" : "завершить поездку"
    if (!confirm(`Вы уверены, что хотите ${label}?`)) return

    setUpdatingId(bookingId)
    try {
      const res = await fetch(`/api/driver/bookings/${bookingId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) { fetchBookings(); toast("Статус обновлён", "success") }
      else toast("Ошибка", "error")
    } catch { toast("Ошибка сервера", "error") }
    finally { setUpdatingId(null) }
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F5F0EB] py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <CardSkeleton />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  if (profile && profile.status !== "approved") {
    return (
      <div className="min-h-screen bg-[#F5F0EB] py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg p-8 border border-[#B8D4E3]">
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-[#1A2332] mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Заявка на рассмотрении
            </h1>
            <p className="text-[#8B7355] mb-6">
              Ваша заявка как водитель находится на проверке. Диспетчер свяжется с вами для подтверждения.
            </p>
            <Link href="/" className="text-[#2D6A8F] hover:text-[#1A2332] transition">
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Личный кабинет
          </h1>
          <Link href="/driver/profile" className="bg-white text-[#1A2332] px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 border border-[#B8D4E3] transition">
            Профиль
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Driver Info Card */}
        {profile && (
          <div className="bg-white rounded-lg p-4 border border-[#B8D4E3] mb-6">
            <div className="flex items-center gap-4 mb-3">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.name || "Водитель"} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#2D6A8F] text-white flex items-center justify-center text-2xl font-bold">
                  {(profile.name || "?").charAt(0)}
                </div>
              )}
              <div>
                <h2 className="font-semibold text-[#1A2332]">{profile.name || "Без имени"}</h2>
                <p className="text-sm text-[#8B7355]">{profile.carInfo || ""}</p>
                <p className="text-sm text-[#8B7355]">{profile.phone}</p>
                {profile.licensePlate && <p className="text-xs text-[#8B7355]">Гос. номер: {profile.licensePlate}</p>}
              </div>
            </div>
            {profile.carPhotoUrl && (
              <div className="mt-2">
                <img src={profile.carPhotoUrl} alt="Автомобиль" className="w-full h-40 object-cover rounded-lg" />
              </div>
            )}
          </div>
        )}

        {/* Bookings */}
        <h2 className="text-xl font-semibold text-[#1A2332] mb-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          Мои поездки
        </h2>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg p-8 border border-[#B8D4E3] text-center">
            <p className="text-[#8B7355]">Назначенных поездок пока нет</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-lg p-4 border border-[#B8D4E3]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-[#1A2332]">
                      {b.route.fromPoint} → {b.route.toPoint}
                    </div>
                    <div className="text-sm text-[#8B7355]">
                      {new Date(b.datetime).toLocaleString("ru")}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[b.status]}`}>
                    {statusText[b.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-[#8B7355]">Пассажиры:</span>
                    <span className="ml-1 font-medium">{b.passengers} чел.</span>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">Класс:</span>
                    <span className="ml-1 font-medium">{b.carClass || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">Расстояние:</span>
                    <span className="ml-1 font-medium">{b.route.distanceKm} км</span>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">Цена:</span>
                    <span className="ml-1 font-medium">{b.priceFinal || b.priceCalculated} ₽</span>
                  </div>
                </div>

                {/* Client info */}
                <div className="bg-[#F5F0EB] rounded-lg p-3 mb-3">
                  <div className="text-sm">
                    <span className="text-[#8B7355]">Клиент:</span>
                    <span className="ml-1">{b.user.name && `${b.user.name} — `}{b.user.phone}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {b.status === "confirmed" && (
                    <button
                      onClick={() => handleStatus(b.id, "in_progress")}
                      disabled={updatingId === b.id}
                      className="flex-1 bg-[#2D6A8F] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#245a7a] disabled:opacity-50 transition"
                    >
                      {updatingId === b.id ? "..." : "Начать поездку"}
                    </button>
                  )}
                  {b.status === "in_progress" && (
                    <button
                      onClick={() => handleStatus(b.id, "completed")}
                      disabled={updatingId === b.id}
                      className="flex-1 bg-[#E8A838] text-[#1A2332] py-2 rounded-lg text-sm font-medium hover:bg-[#d49a30] disabled:opacity-50 transition"
                    >
                      {updatingId === b.id ? "..." : "Завершить поездку"}
                    </button>
                  )}
                  {b.status === "completed" && (
                    <div className="text-sm text-[#8B7355] py-2">Поездка завершена</div>
                  )}
                  {b.status === "cancelled" && (
                    <div className="text-sm text-red-500 py-2">
                      Отменена{b.cancelReason && `: ${b.cancelReason}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
