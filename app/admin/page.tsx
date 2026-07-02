"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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
  user: {
    phone: string
    name: string | null
  }
  route: {
    fromPoint: string
    toPoint: string
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [driverName, setDriverName] = useState("")
  const [driverPhone, setDriverPhone] = useState("")
  const [carInfo, setCarInfo] = useState("")
  const [priceFinal, setPriceFinal] = useState("")
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchBookings()
    }
  }, [status])

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/admin/bookings")
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
        alert("Заявка подтверждена! SMS отправлено клиенту.")
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
        Загрузка...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Админ-панель</h1>
          <button
            onClick={() => router.push("/")}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            На главную
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Дата поездки</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Маршрут</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Клиент</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Пассажиры</th>
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
                    {booking.user.phone}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {booking.passengers} чел., {booking.baggageType}
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
                    {booking.status === "pending" && (
                      <button
                        onClick={() => {
                          setSelectedBooking(booking)
                          setPriceFinal(booking.priceCalculated.toString())
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Подтвердить
                      </button>
                    )}
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
              Подтверждение заявки N{selectedBooking.id.slice(-6)}
            </h2>

            <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
              <p><strong>Маршрут:</strong> {selectedBooking.route.fromPoint} → {selectedBooking.route.toPoint}</p>
              <p><strong>Дата:</strong> {new Date(selectedBooking.datetime).toLocaleString("ru")}</p>
              <p><strong>Клиент:</strong> {selectedBooking.user.phone}</p>
              <p><strong>Пассажиры:</strong> {selectedBooking.passengers}</p>
            </div>

            <form onSubmit={handleConfirm} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Имя водителя
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Телефон водителя
                </label>
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
                <label className="block text-sm font-medium mb-1">
                  Автомобиль
                </label>
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
                <label className="block text-sm font-medium mb-1">
                  Итоговая цена (руб)
                </label>
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
