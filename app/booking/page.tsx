"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"

type Route = {
  id: string
  fromPoint: string
  toPoint: string
  distanceKm: number
  durationMin: number
  priceBase: number
  pricePerBaggage: number
}

type CarClass = {
  id: string
  name: string
  coefficient: number
}

type DistanceData = {
  cities: string[]
  distances: number[][]
}

const defaultCarClasses: CarClass[] = [
  { id: "economy", name: "Эконом", coefficient: 0.8 },
  { id: "comfort", name: "Комфорт", coefficient: 1.0 },
]

const baggageOptions = [
  { value: "none", label: "Без багажа", icon: "🧳" },
  { value: "1", label: "1 чемодан", icon: "🧳" },
  { value: "2plus", label: "2+ чемодана", icon: "🧳🧳" },
  { value: "oversized", label: "Негабаритный", icon: "📦" }
]

function getDistance(cities: string[], matrix: number[][], from: string, to: string): number | null {
  const i = cities.indexOf(from)
  const j = cities.indexOf(to)
  if (i === -1 || j === -1) return null
  return matrix[i][j]
}

function estimateDuration(distanceKm: number): number {
  return Math.round(distanceKm * 1.2)
}

export default function BookingPage() {
  const { status } = useAuth()
  const router = useRouter()
  const [routes, setRoutes] = useState<Route[]>([])
  const [carClasses, setCarClasses] = useState<CarClass[]>(defaultCarClasses)
  const [pricePerKm, setPricePerKm] = useState(25)
  const [selectedRouteId, setSelectedRouteId] = useState("")
  const [datetime, setDatetime] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [baggage, setBaggage] = useState("none")
  const [carClass, setCarClass] = useState("comfort")
  const [price, setPrice] = useState(0)
  const [loading, setLoading] = useState(false)
  const [routesLoading, setRoutesLoading] = useState(true)
  const [error, setError] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPersonalData, setAcceptPersonalData] = useState(false)
  const [acceptMarketing, setAcceptMarketing] = useState(false)
  const [notes, setNotes] = useState("")

  // City selection
  const [distanceData, setDistanceData] = useState<DistanceData | null>(null)
  const [fromCity, setFromCity] = useState("")
  const [toCity, setToCity] = useState("")
  const [fromSearch, setFromSearch] = useState("")
  const [toSearch, setToSearch] = useState("")
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin")
  }, [status, router])

  useEffect(() => {
    Promise.all([
      fetch("/api/routes").then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
      fetch("/api/distances").then(r => r.json()),
    ]).then(([routesData, settings, dist]) => {
      setRoutes(routesData)
      if (settings.pricePerKm) setPricePerKm(settings.pricePerKm)
      if (settings.carClasses?.length) setCarClasses(settings.carClasses)
      setDistanceData(dist)
      setRoutesLoading(false)
    }).catch(() => {
      setError("Ошибка загрузки данных")
      setRoutesLoading(false)
    })
  }, [])

  const customDistance = useMemo(() => {
    if (!distanceData || !fromCity || !toCity || fromCity === toCity) return null
    return getDistance(distanceData.cities, distanceData.distances, fromCity, toCity)
  }, [distanceData, fromCity, toCity])

  const customPrice = useMemo(() => {
    if (customDistance === null) return 0
    const coeff = carClasses.find(c => c.id === carClass)?.coefficient || 1.0
    let p = Math.round(customDistance * pricePerKm * coeff)
    if (passengers > 4) p += (passengers - 4) * 300
    if (baggage === "1") p += 500
    if (baggage === "2plus") p += 1000
    if (baggage === "oversized") p += 1500
    if (datetime) {
      const hour = new Date(datetime).getHours()
      if (hour >= 23 || hour < 6) p = Math.round(p * 1.2)
    }
    return p
  }, [customDistance, pricePerKm, carClass, carClasses, passengers, baggage, datetime])

  useEffect(() => {
    if (selectedRouteId) {
      fetch("/api/calculate-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeId: selectedRouteId, passengers, baggage, datetime, carClass })
      })
        .then(res => res.json())
        .then(data => setPrice(data.price || 0))
    }
  }, [selectedRouteId, passengers, baggage, datetime, carClass])

  useEffect(() => {
    if (fromCity && toCity && fromCity !== toCity) {
      setPrice(customPrice)
    }
  }, [customPrice, fromCity, toCity])

  const filteredFromCities = useMemo(() => {
    if (!distanceData) return []
    const q = fromSearch.toLowerCase()
    return q ? distanceData.cities.filter(c => c.toLowerCase().includes(q) && c !== toCity)
             : distanceData.cities.filter(c => c !== toCity)
  }, [distanceData, fromSearch, toCity])

  const filteredToCities = useMemo(() => {
    if (!distanceData) return []
    const q = toSearch.toLowerCase()
    return q ? distanceData.cities.filter(c => c.toLowerCase().includes(q) && c !== fromCity)
             : distanceData.cities.filter(c => c !== fromCity)
  }, [distanceData, toSearch, fromCity])

  const hasRoute = selectedRouteId || (fromCity && toCity && fromCity !== toCity)
  const selectedRoute = routes.find(r => r.id === selectedRouteId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const body: Record<string, unknown> = {
        datetime,
        passengers,
        baggageType: baggage,
        carClass,
        priceCalculated: price,
      }

      if (fromCity && toCity && fromCity !== toCity) {
        body.fromPoint = fromCity
        body.toPoint = toCity
        body.distanceKm = customDistance
        body.durationMin = customDistance ? estimateDuration(customDistance) : null
      } else if (selectedRouteId) {
        body.routeId = selectedRouteId
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (res.ok) {
        router.push(`/booking/success?id=${data.booking.id}`)
      } else {
        setError(data.error || "Ошибка создания заявки")
      }
    } catch {
      setError("Ошибка сервера. Попробуйте позже.")
    } finally {
      setLoading(false)
    }
  }

  const minDate = new Date()
  minDate.setHours(minDate.getHours() + 2)
  const minDateString = minDate.toISOString().slice(0, 16)

  if (status === "loading" || routesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-2">Бронирование трансфера</h1>
          <p className="text-gray-500 text-sm mb-6">
            Заполните форму и диспетчер свяжется с вами для подтверждения
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* FROM */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Откуда</label>
              <input
                type="text"
                value={fromCity || fromSearch}
                onChange={e => { setFromSearch(e.target.value); setFromCity(""); setSelectedRouteId(""); setShowFromDropdown(true) }}
                onFocus={() => setShowFromDropdown(true)}
                placeholder="Город отправления"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {showFromDropdown && filteredFromCities.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredFromCities.map(c => (
                    <button key={c} type="button"
                      onMouseDown={() => { setFromCity(c); setFromSearch(""); setShowFromDropdown(false); setSelectedRouteId("") }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50">{c}</button>
                  ))}
                </div>
              )}
            </div>

            {/* TO */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Куда</label>
              <input
                type="text"
                value={toCity || toSearch}
                onChange={e => { setToSearch(e.target.value); setToCity(""); setSelectedRouteId(""); setShowToDropdown(true) }}
                onFocus={() => setShowToDropdown(true)}
                placeholder="Город назначения"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {showToDropdown && filteredToCities.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredToCities.map(c => (
                    <button key={c} type="button"
                      onMouseDown={() => { setToCity(c); setToSearch(""); setShowToDropdown(false); setSelectedRouteId("") }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50">{c}</button>
                  ))}
                </div>
              )}
            </div>

            {fromCity && toCity && fromCity === toCity && (
              <p className="text-xs text-red-500 -mt-2">Города должны отличаться</p>
            )}

            {fromCity && toCity && fromCity !== toCity && customDistance !== null && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Расстояние:</span>
                  <span className="font-medium">{customDistance} км</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Время в пути:</span>
                  <span className="font-medium">~{estimateDuration(customDistance)} мин</span>
                </div>
              </div>
            )}

            {fromCity && toCity && fromCity !== toCity && customDistance === null && (
              <p className="text-xs text-amber-600">Маршрут не найден в базе расстояний</p>
            )}

            {/* Or select from ready routes */}
            {!fromCity && !toCity && routes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Или выберите из готовых маршрутов
                </label>
                <select value={selectedRouteId} onChange={e => setSelectedRouteId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Не выбран</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.fromPoint} → {r.toPoint} ({r.distanceKm} км)</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата и время вылета</label>
              <input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)}
                min={minDateString}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
              <p className="text-xs text-gray-500 mt-1">Минимум 2 часа от текущего времени</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Пассажиры</label>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl font-bold">−</button>
                <span className="text-2xl font-bold w-12 text-center">{passengers}</span>
                <button type="button" onClick={() => setPassengers(Math.min(20, passengers + 1))}
                  className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl font-bold">+</button>
              </div>
              {passengers > 4 && <p className="text-xs text-amber-600 mt-1">+300₽ за каждого пассажира сверх 4</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Класс автомобиля</label>
              <div className="grid grid-cols-3 gap-2">
                {carClasses.map(cc => (
                  <button key={cc.id} type="button" onClick={() => setCarClass(cc.id)}
                    className={`p-3 rounded-lg border-2 text-center transition ${carClass === cc.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <p className="text-sm font-medium">{cc.name}</p>
                    <p className="text-xs text-gray-500">{cc.coefficient}×</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Багаж</label>
              <div className="grid grid-cols-2 gap-2">
                {baggageOptions.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setBaggage(opt.value)}
                    className={`p-3 rounded-lg border-2 text-left transition ${baggage === opt.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <span className="text-lg">{opt.icon}</span>
                    <p className="text-sm font-medium mt-1">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            {hasRoute && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{fromCity || selectedRoute?.fromPoint}</p>
                    <p className="text-gray-500 text-sm">→ {toCity || selectedRoute?.toPoint}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{customDistance || selectedRoute?.distanceKm} км</p>
                    <p className="text-sm text-gray-500">~{customDistance ? estimateDuration(customDistance) : selectedRoute?.durationMin} мин</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {carClasses.find(c => c.id === carClass)?.name || "Комфорт"} · {pricePerKm} ₽/км × {carClasses.find(c => c.id === carClass)?.coefficient || 1}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Стоимость:</span>
                    <span className="text-xl font-bold text-blue-600">{price} ₽</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий <span className="text-gray-400">(необязательно)</span>
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Особые пожелания, время встречи, номер рейса..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none" rows={3} maxLength={500} />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" required />
                <span className="text-sm text-gray-600">
                  Я принимаю условия <a href="/terms" target="_blank" className="text-blue-600 hover:underline">Пользовательского соглашения</a>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={acceptPersonalData} onChange={e => setAcceptPersonalData(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" required />
                <span className="text-sm text-gray-600">Я даю согласие на обработку персональных данных</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={acceptMarketing} onChange={e => setAcceptMarketing(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="text-sm text-gray-600">Я согласен на получение рекламных материалов</span>
              </label>
            </div>

            <button type="submit" disabled={loading || !hasRoute || !datetime || !acceptTerms || !acceptPersonalData}
              className="w-full bg-blue-600 text-white p-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Отправка...
                </span>
              ) : "Отправить заявку"}
            </button>
          </form>
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">Нажимая «Отправить», вы соглашаетесь с условиями обслуживания</p>
      </div>
    </div>
  )
}
