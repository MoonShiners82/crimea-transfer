"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
  createdAt: string
  cancelReason: string | null
  user: {
    phone: string
    name: string | null
  }
  route: {
    fromPoint: string
    toPoint: string
  }
}

type Stats = {
  bookings: {
    total: number
    pending: number
    confirmed: number
    completed: number
    cancelled: number
    today: number
    week: number
    month: number
  }
  revenue: {
    total: number
    today: number
    average: number
  }
  users: {
    total: number
  }
  popularRoutes: { fromPoint: string; toPoint: string; count: number }[]
  recentBookings: Booking[]
}

const statusOptions = [
  { value: "", label: "Все" },
  { value: "pending", label: "Ожидают" },
  { value: "confirmed", label: "Подтверждённые" },
  { value: "completed", label: "Завершённые" },
  { value: "cancelled", label: "Отменённые" },
]

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showDashboard, setShowDashboard] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [driverName, setDriverName] = useState("")
  const [driverPhone, setDriverPhone] = useState("")
  const [carInfo, setCarInfo] = useState("")
  const [priceFinal, setPriceFinal] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchBookings()
      fetchStats()
    }
  }, [status, filterStatus, searchQuery])

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set("status", filterStatus)
      if (searchQuery) params.set("search", searchQuery)
      const url = `/api/admin/bookings${params.toString() ? `?${params.toString()}` : ""}`
      const res = await fetch(url)
      if (res.status === 403) {
        alert("Доступ запрещён. Вы не администратор.")
        router.push("/")
        return
      }
      const data = await res.json()
      setBookings(data)
    } catch (err) {
      console.error("Fetch bookings error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats")
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error("Fetch stats error:", err)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return

    setConfirming(true)

    try {
      const res = await fetch("/api/admin/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          driverName,
          driverPhone,
          carInfo,
          priceFinal: parseInt(priceFinal)
        })
      })

      if (res.ok) {
        alert("Заявка подтверждена!")
        setSelectedBooking(null)
        setDriverName("")
        setDriverPhone("")
        setCarInfo("")
        setPriceFinal("")
        fetchBookings()
      } else {
        alert("Ошибка подтверждения")
      }
    } catch (err) {
      alert("Ошибка сервера")
    } finally {
      setConfirming(false)
    }
  }

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Отменить заявку?")) return

    setCancellingId(bookingId)
    try {
      const res = await fetch("/api/admin/bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: "cancelled" })
      })
      if (res.ok) {
        fetchBookings()
        fetchStats()
      } else {
        alert("Ошибка отмены")
      }
    } catch {
      alert("Ошибка сервера")
    } finally {
      setCancellingId(null)
    }
  }

  const handleComplete = async (bookingId: string) => {
    if (!confirm("Завершить заявку?")) return

    setCompletingId(bookingId)
    try {
      const res = await fetch("/api/admin/bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: "completed" })
      })
      if (res.ok) {
        fetchBookings()
        fetchStats()
      } else {
        alert("Ошибка завершения")
      }
    } catch {
      alert("Ошибка сервера")
    } finally {
      setCompletingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "confirmed": return "bg-green-100 text-green-800"
      case "cancelled": return "bg-red-100 text-red-800"
      case "completed": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Ожидает"
      case "confirmed": return "Подтверждена"
      case "cancelled": return "Отменена"
      case "completed": return "Завершена"
      default: return status
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Админ-панель</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className={`px-4 py-2 rounded transition ${showDashboard ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
            >
              {showDashboard ? "Скрыть статистику" : "Показать статистику"}
            </button>
            <Link
              href="/admin/background-check"
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
            >
              Проверка данных
            </Link>
            <Link
              href="/"
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
            >
              На главную
            </Link>
          </div>
        </div>

        {showDashboard && stats && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Статистика</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Всего заявок</div>
                <div className="text-2xl font-bold">{stats.bookings.total}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Ожидают</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.bookings.pending}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Подтверждены</div>
                <div className="text-2xl font-bold text-green-600">{stats.bookings.confirmed}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Завершены</div>
                <div className="text-2xl font-bold text-blue-600">{stats.bookings.completed}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Отменены</div>
                <div className="text-2xl font-bold text-red-600">{stats.bookings.cancelled}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Выручка</div>
                <div className="text-2xl font-bold">{stats.revenue.total.toLocaleString("ru")} ₽</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Средний чек</div>
                <div className="text-2xl font-bold">{stats.revenue.average.toLocaleString("ru")} ₽</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Пользователей</div>
                <div className="text-2xl font-bold">{stats.users.total}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Сегодня</div>
                <div className="text-lg font-semibold">{stats.bookings.today} заявок · {stats.revenue.today.toLocaleString("ru")} ₽</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">На этой неделе</div>
                <div className="text-lg font-semibold">{stats.bookings.week} заявок</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">В этом месяце</div>
                <div className="text-lg font-semibold">{stats.bookings.month} заявок</div>
              </div>
            </div>

            {stats.popularRoutes.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h3 className="font-semibold mb-3">Популярные маршруты</h3>
                <div className="space-y-2">
                  {stats.popularRoutes.map((route, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span>{route.fromPoint} → {route.toPoint}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{route.count} заявок</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.recentBookings.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-3">Последние заявки</h3>
                <div className="space-y-2">
                  {stats.recentBookings.map((b) => (
                    <div key={b.id} className="flex justify-between items-center text-sm">
                      <span>{b.user.phone} — {b.route.fromPoint} → {b.route.toPoint}</span>
                      <span className={`px-2 py-1 rounded ${getStatusColor(b.status)}`}>{getStatusText(b.status)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterStatus === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по телефону, имени, маршруту..."
              className="px-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">
              Заявок: {bookings.length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Дата поездки</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Маршрут</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Клиент</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Водитель</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Пассажиры</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Багаж</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Цена</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Статус</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">
                    {booking.id.slice(-6)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(booking.datetime).toLocaleString("ru")}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {booking.route.fromPoint} → {booking.route.toPoint}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {booking.user.name && (
                      <div className="font-medium">{booking.user.name}</div>
                    )}
                    <div className="text-gray-500">{booking.user.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {booking.driverName ? (
                      <div>
                        <div className="font-medium">{booking.driverName}</div>
                        {booking.driverPhone && (
                          <div className="text-gray-500 text-xs">{booking.driverPhone}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {booking.passengers} чел.
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {booking.baggageType === "none" ? "—" : booking.baggageType}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {booking.priceFinal || booking.priceCalculated} ₽
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {booking.status === "pending" && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking)
                            setPriceFinal(booking.priceCalculated.toString())
                          }}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Подтвердить
                        </button>
                      )}
                      {booking.status === "confirmed" && (
                        <button
                          onClick={() => handleComplete(booking.id)}
                          disabled={completingId === booking.id}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {completingId === booking.id ? "..." : "Завершить"}
                        </button>
                      )}
                      {(booking.status === "pending" || booking.status === "confirmed") && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:bg-gray-400"
                        >
                          {cancellingId === booking.id ? "..." : "Отмена"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {bookings.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Заявок пока нет
            </div>
          )}
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              Подтверждение заявки #{selectedBooking.id.slice(-6)}
            </h2>

            <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
              <p><strong>Маршрут:</strong> {selectedBooking.route.fromPoint} → {selectedBooking.route.toPoint}</p>
              <p><strong>Дата:</strong> {new Date(selectedBooking.datetime).toLocaleString("ru")}</p>
              <p><strong>Клиент:</strong> {selectedBooking.user.name && `${selectedBooking.user.name} — `}{selectedBooking.user.phone}</p>
              <p><strong>Пассажиры:</strong> {selectedBooking.passengers}</p>
              <p><strong>Багаж:</strong> {selectedBooking.baggageType === "none" ? "Нет" : selectedBooking.baggageType}</p>
            </div>

            <form onSubmit={handleConfirm} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Имя водителя</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Телефон водителя</label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="+79991234567"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Автомобиль</label>
                <input
                  type="text"
                  value={carInfo}
                  onChange={(e) => setCarInfo(e.target.value)}
                  placeholder="Hyundai Solaris, А123АА77"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Итоговая цена (руб)</label>
                <input
                  type="number"
                  value={priceFinal}
                  onChange={(e) => setPriceFinal(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={confirming}
                  className="flex-1 bg-green-600 text-white p-2 rounded font-semibold hover:bg-green-700 disabled:bg-gray-400"
                >
                  {confirming ? "Отправка..." : "Подтвердить"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBooking(null)
                    setDriverName("")
                    setDriverPhone("")
                    setCarInfo("")
                    setPriceFinal("")
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 p-2 rounded font-semibold hover:bg-gray-300"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
