"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type Route = {
  id: string
  fromPoint: string
  toPoint: string
  distanceKm: number
  durationMin: number
  priceBase: number
}

export default function BookingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [routes, setRoutes] = useState<Route[]>([])
  const [routeId, setRouteId] = useState("")
  const [datetime, setDatetime] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [baggage, setBaggage] = useState("none")
  const [price, setPrice] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    fetch("/api/routes")
      .then(res => res.json())
      .then(data => setRoutes(data))
      .catch(err => console.error("Routes error:", err))
  }, [])

  useEffect(() => {
    if (routeId) {
      fetch("/api/calculate-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeId, passengers, baggage, datetime })
      })
        .then(res => res.json())
        .then(data => setPrice(data.price || 0))
    }
  }, [routeId, passengers, baggage, datetime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeId,
          datetime,
          passengers,
          baggageType: baggage,
          priceCalculated: price
        })
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/booking/success?id=${data.bookingId}`)
      } else {
        alert("Ошибка создания заявки")
      }
    } catch (err) {
      alert("Ошибка сервера")
    } finally {
      setLoading(false)
    }
  }

  const selectedRoute = routes.find(r => r.id === routeId)

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Загрузка...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Бронирование трансфера</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Маршрут
            </label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-full p-3 border rounded"
              required
            >
              <option value="">Выберите маршрут</option>
              {routes.map(route => (
                <option key={route.id} value={route.id}>
                  {route.fromPoint} → {route.toPoint} ({route.distanceKm} км, ~{route.durationMin} мин)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Дата и время
            </label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="w-full p-3 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Количество пассажиров
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={passengers}
              onChange={(e) => setPassengers(+e.target.value)}
              className="w-full p-3 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Багаж
            </label>
            <select
              value={baggage}
              onChange={(e) => setBaggage(e.target.value)}
              className="w-full p-3 border rounded"
              required
            >
              <option value="none">Без багажа</option>
              <option value="1">1 чемодан</option>
              <option value="2plus">2+ чемодана</option>
              <option value="oversized">Негабаритный багаж</option>
            </select>
          </div>

          {price > 0 && (
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <p className="text-lg font-semibold text-blue-900">
                Предварительная стоимость: {price} ₽
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Окончательная цена уточнит диспетчер
              </p>
              {selectedRoute && (
                <p className="text-sm text-gray-600 mt-2">
                  📍 {selectedRoute.fromPoint} → {selectedRoute.toPoint}
                  <br />
                  🕐 ~{selectedRoute.durationMin} мин
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !routeId || !datetime}
            className="w-full bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Отправка..." : "Отправить заявку"}
          </button>
        </form>
      </div>
    </div>
  )
}