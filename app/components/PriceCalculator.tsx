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

type CarClass = {
  id: string
  name: string
  coefficient: number
}

const defaultCarClasses: CarClass[] = [
  { id: "economy", name: "Эконом", coefficient: 0.8 },
  { id: "comfort", name: "Комфорт", coefficient: 1.0 },
]

export default function PriceCalculator() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [carClasses, setCarClasses] = useState<CarClass[]>(defaultCarClasses)
  const [pricePerKm, setPricePerKm] = useState(25)
  const [routeId, setRouteId] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [carClass, setCarClass] = useState("comfort")
  const [loading, setLoading] = useState(true)
  const [price, setPrice] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch("/api/routes").then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(([routesData, settings]) => {
      setRoutes(routesData)
      if (settings.pricePerKm) setPricePerKm(settings.pricePerKm)
      if (settings.carClasses?.length) setCarClasses(settings.carClasses)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const selectedRoute = routes.find(r => r.id === routeId)
  const selectedClass = carClasses.find(c => c.id === carClass)
  const coefficient = selectedClass?.coefficient || 1.0

  useEffect(() => {
    if (selectedRoute) {
      let p = Math.round(selectedRoute.distanceKm * pricePerKm * coefficient)
      if (passengers > 4) p += (passengers - 4) * 300
      setPrice(p)
    } else {
      setPrice(0)
    }
  }, [selectedRoute, passengers, coefficient, pricePerKm])

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Класс автомобиля</label>
          <div className="grid grid-cols-3 gap-2">
            {carClasses.map(cc => (
              <button
                key={cc.id}
                type="button"
                onClick={() => setCarClass(cc.id)}
                className={`p-2 rounded-lg border-2 text-center transition ${
                  carClass === cc.id
                    ? "border-[#2D6A8F] bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-sm font-medium">{cc.name}</p>
                <p className="text-xs text-gray-500">{cc.coefficient}×</p>
              </button>
            ))}
          </div>
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
          {passengers > 4 && (
            <p className="text-xs text-amber-600 mt-1">
              +{(passengers - 4) * 300}₽ за доп. пассажиров
            </p>
          )}
        </div>

        {selectedRoute && (
          <div className="bg-[#F5F0EB] p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-[#8B7355]">{selectedRoute.fromPoint} → {selectedRoute.toPoint}</p>
                <p className="text-xs text-[#8B7355]">{selectedRoute.distanceKm} км · ~{selectedRoute.durationMin} мин</p>
                <p className="text-xs text-[#8B7355]">{selectedClass?.name || "Комфорт"} · {pricePerKm} ₽/км × {coefficient}</p>
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
