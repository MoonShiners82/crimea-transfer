"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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
  const { status: sessionStatus } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
