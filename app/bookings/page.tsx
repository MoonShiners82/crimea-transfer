"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { Skeleton, CardSkeleton } from "../components/Skeleton"
import { useToast } from "../components/Toast"

interface Booking {
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
  createdAt: string
  route: {
    fromPoint: string
    toPoint: string
    distanceKm: number
    durationMin: number
  }
}

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: "Ожидает подтверждения", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { text: "Подтверждено", color: "bg-green-100 text-green-800" },
  completed: { text: "Завершено", color: "bg-gray-100 text-gray-800" },
  cancelled: { text: "Отменено", color: "bg-red-100 text-red-800" },
}

const baggageLabels: Record<string, string> = {
  none: "Без багажа",
  "1": "1 чемодан",
  "2plus": "2+ чемодана",
  oversized: "Негабаритный",
}

export default function BookingsPage() {
  const { status: sessionStatus } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [editDatetime, setEditDatetime] = useState("")
  const [editPassengers, setEditPassengers] = useState(1)
  const [editBaggage, setEditBaggage] = useState("none")
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    if (sessionStatus !== "authenticated") return

    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => {
        setBookings(data.bookings || [])
        setLoading(false)
      })
      .catch(() => {
        setError("Ошибка загрузки бронирований")
        setLoading(false)
      })
  }, [sessionStatus, router])

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Вы уверены, что хотите отменить бронирование?")) return
    setCancellingId(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Отмена пользователем" })
      })
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b))
        toast("Бронирование отменено", "success")
      } else {
        const data = await res.json()
        toast(data.error || "Ошибка отмены", "error")
      }
    } catch {
      toast("Ошибка сети", "error")
    } finally {
      setCancellingId(null)
    }
  }

  const openEdit = (booking: Booking) => {
    setEditingBooking(booking)
    setEditDatetime(booking.datetime.slice(0, 16))
    setEditPassengers(booking.passengers)
    setEditBaggage(booking.baggageType)
  }

  const handleEditSave = async () => {
    if (!editingBooking) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datetime: editDatetime,
          passengers: editPassengers,
          baggageType: editBaggage,
        })
      })
      if (res.ok) {
        const data = await res.json()
        setBookings(prev => prev.map(b => b.id === editingBooking.id ? { ...b, ...data.booking } : b))
        setEditingBooking(null)
        toast("Бронирование обновлено", "success")
      } else {
        const data = await res.json()
        toast(data.error || "Ошибка сохранения", "error")
      }
    } catch {
      toast("Ошибка сети", "error")
    } finally {
      setEditSaving(false)
    }
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Мои бронирования</h1>
          <button
            onClick={() => router.push("/booking")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Новое бронирование
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">У вас пока нет бронирований</p>
            <button
              onClick={() => router.push("/booking")}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Забронировать первый трансфер
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const status = statusLabels[booking.status] || {
                text: booking.status,
                color: "bg-gray-100 text-gray-800",
              }
              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {booking.route.fromPoint} → {booking.route.toPoint}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.datetime).toLocaleString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
                    >
                      {status.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Пассажиры</p>
                      <p className="font-medium">{booking.passengers}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Багаж</p>
                      <p className="font-medium">
                        {baggageLabels[booking.baggageType] || booking.baggageType}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Стоимость</p>
                      <p className="font-medium">
                        {booking.priceFinal || booking.priceCalculated} ₽
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Время в пути</p>
                      <p className="font-medium">{booking.route.durationMin} мин</p>
                    </div>
                  </div>

                  {booking.driverName && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Водитель</p>
                        <p className="font-medium">{booking.driverName}</p>
                      </div>
                      {booking.driverPhone && (
                        <div>
                          <p className="text-gray-500">Телефон</p>
                          <p className="font-medium">{booking.driverPhone}</p>
                        </div>
                      )}
                      {booking.carInfo && (
                        <div>
                          <p className="text-gray-500">Автомобиль</p>
                          <p className="font-medium">{booking.carInfo}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {booking.status !== "cancelled" && booking.status !== "completed" && (
                    <div className="mt-4 pt-4 border-t flex gap-4">
                      {booking.status === "pending" && (
                        <button
                          onClick={() => openEdit(booking)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Изменить
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? "Отмена..." : "Отменить бронирование"}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {editingBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditingBooking(null)}>
            <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Редактирование бронирования</h2>
              <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
                <p className="font-medium">{editingBooking.route.fromPoint} → {editingBooking.route.toPoint}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата и время</label>
                  <input
                    type="datetime-local"
                    value={editDatetime}
                    onChange={e => setEditDatetime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Пассажиры</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setEditPassengers(Math.max(1, editPassengers - 1))} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">−</button>
                    <span className="font-medium">{editPassengers}</span>
                    <button type="button" onClick={() => setEditPassengers(Math.min(20, editPassengers + 1))} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Багаж</label>
                  <select value={editBaggage} onChange={e => setEditBaggage(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg">
                    <option value="none">Без багажа</option>
                    <option value="1">1 чемодан</option>
                    <option value="2plus">2+ чемодана</option>
                    <option value="oversized">Негабаритный</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={handleEditSave} disabled={editSaving} className="flex-1 bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {editSaving ? "Сохранение..." : "Сохранить"}
                </button>
                <button onClick={() => setEditingBooking(null)} className="flex-1 bg-gray-200 p-2 rounded-lg font-semibold hover:bg-gray-300">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
