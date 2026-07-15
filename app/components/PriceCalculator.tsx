"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Route = {
  id: string
  fromPoint: string
  toPoint: string
  distanceKm: number
  durationMin: number
  priceBase: number
}

export default function PriceCalculator() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [routeId, setRouteId] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/routes")
      .then(res => res.json())
      .then(data => {
        setRoutes(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const selectedRoute = routes.find(r => r.id === routeId)
  const price = selectedRoute
    ? selectedRoute.priceBase + (passengers > 4 ? (passengers - 4) * 300 : 0)
    : 0

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        Рассчитайте стоимость
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Маршрут</label>
          <select
            value={routeId}
            onChange={e => setRouteId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D6A8F] focus:border-[#2D6A8F]"
          >
            <option value="">Выберите маршрут</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>
                {r.fromPoint} → {r.toPoint} ({r.distanceKm} км)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Пассажиры</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPassengers(Math.max(1, passengers - 1))}
              className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-lg font-bold"
            >
              −
            </button>
            <span className="text-xl font-bold w-10 text-center">{passengers}</span>
            <button
              type="button"
              onClick={() => setPassengers(Math.min(20, passengers + 1))}
              className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-lg font-bold"
            >
              +
            </button>
          </div>
        </div>

        {selectedRoute && (
          <div className="bg-[#F5F0EB] p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-[#8B7355]">{selectedRoute.fromPoint} → {selectedRoute.toPoint}</p>
                <p className="text-xs text-[#8B7355]">{selectedRoute.distanceKm} км · ~{selectedRoute.durationMin} мин</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#2D6A8F]">{price} ₽</p>
                {passengers > 4 && (
                  <p className="text-xs text-amber-600">+{(passengers - 4) * 300}₽ за доп. пассажиров</p>
                )}
              </div>
            </div>
          </div>
        )}

        <Link
          href="/booking"
          className="block w-full bg-[#E8A838] text-[#1A2332] text-center py-3 rounded-lg font-semibold hover:bg-[#d49a30] transition"
        >
          Забронировать
        </Link>
      </div>
    </div>
  )
}
