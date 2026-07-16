"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "../components/Toast"
import { useAuth } from "@/lib/useAuth"
import { Skeleton, TableSkeleton } from "../components/Skeleton"

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
  notes: string | null
  createdAt: string
  cancelReason: string | null
  user: { phone: string; name: string | null }
  route: { id: string; fromPoint: string; toPoint: string }
}

type Driver = {
  id: string
  name: string
  phone: string
  carInfo: string
}

type Route = {
  id: string
  fromPoint: string
  toPoint: string
  priceBase: number
}

type Stats = {
  today: { total: number; pending: number; confirmed: number; completed: number; cancelled: number }
  week: number
  month: number
  revenue: number
}

const statusOptions = [
  { value: "", label: "Все" },
  { value: "pending", label: "Ожидают" },
  { value: "confirmed", label: "Подтверждённые" },
  { value: "in_progress", label: "В пути" },
  { value: "completed", label: "Завершённые" },
  { value: "cancelled", label: "Отменённые" },
]

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
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

export default function DispatcherPage() {
  const { user, status: authStatus } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Confirm modal (new booking)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState("")
  const [priceFinal, setPriceFinal] = useState("")
  const [confirming, setConfirming] = useState(false)

  // Edit modal
  const [editBooking, setEditBooking] = useState<Booking | null>(null)
  const [editRouteId, setEditRouteId] = useState("")
  const [editDriverId, setEditDriverId] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editCarInfo, setEditCarInfo] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editing, setEditing] = useState(false)

  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/auth/staff-login")
    else if (authStatus === "authenticated" && user?.role !== "dispatcher") router.push("/")
  }, [authStatus, user, router])

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchBookings()
      fetchStats()
      fetchDrivers()
      fetchRoutes()
    }
  }, [authStatus])

  const fetchBookings = async (statusOverride?: string, searchOverride?: string) => {
    try {
      const activeStatus = statusOverride !== undefined ? statusOverride : filterStatus
      const activeSearch = searchOverride !== undefined ? searchOverride : searchQuery
      const params = new URLSearchParams()
      if (activeStatus) params.set("status", activeStatus)
      if (activeSearch) params.set("search", activeSearch)
      const res = await fetch(`/api/dispatcher/bookings${params.toString() ? `?${params.toString()}` : ""}`)
      if (res.status === 403) { router.push("/"); return }
      if (res.ok) {
        const result = await res.json()
        setBookings(result.data ?? result)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dispatcher/stats")
      if (res.ok) setStats(await res.json())
    } catch (e) { console.error(e) }
  }

  const fetchDrivers = async () => {
    try {
      const res = await fetch("/api/dispatcher/drivers")
      if (res.ok) setDrivers(await res.json())
    } catch (e) { console.error(e) }
  }

  const fetchRoutes = async () => {
    try {
      const res = await fetch("/api/routes")
      if (res.ok) setRoutes(await res.json())
    } catch (e) { console.error(e) }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking || !selectedDriverId) return
    setConfirming(true)

    const driver = drivers.find(d => d.id === selectedDriverId)
    if (!driver) { setConfirming(false); return }

    try {
      const res = await fetch("/api/admin/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          driverName: driver.name,
          driverPhone: driver.phone,
          carInfo: driver.carInfo,
          priceFinal: parseInt(priceFinal),
          driverId: driver.id
        })
      })
      if (res.ok) { setSelectedBooking(null); fetchBookings(); fetchStats(); toast("Водитель назначен", "success") }
      else toast("Ошибка подтверждения", "error")
    } catch { toast("Ошибка сервера", "error") }
    finally { setConfirming(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editBooking) return
    setEditing(true)

    const driver = drivers.find(d => d.id === editDriverId)

    try {
      const editRes = await fetch("/api/admin/bookings/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: editBooking.id,
          priceFinal: parseInt(editPrice) || undefined,
          driverName: driver?.name || undefined,
          driverPhone: driver?.phone || undefined,
          carInfo: editCarInfo || undefined,
        })
      })

      if (editStatus !== editBooking.status) {
        const statusRes = await fetch("/api/admin/bookings/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: editBooking.id, status: editStatus })
        })
        if (!statusRes.ok) {
          const data = await statusRes.json()
          toast(data.error || "Ошибка смены статуса", "error")
          setEditing(false)
          return
        }
      }

      if (editRes.ok) { setEditBooking(null); fetchBookings(); fetchStats(); toast("Сохранено", "success") }
      else toast("Ошибка сохранения", "error")
    } catch { toast("Ошибка сервера", "error") }
    finally { setEditing(false) }
  }

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Отменить бронирование?")) return
    setCancellingId(bookingId)
    try {
      const res = await fetch("/api/admin/bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: "cancelled" })
      })
      if (res.ok) { fetchBookings(); fetchStats(); toast("Бронирование отменено", "success") }
      else toast("Ошибка отмены", "error")
    } catch { toast("Ошибка сервера", "error") }
    finally { setCancellingId(null) }
  }

  const openEdit = (b: Booking) => {
    setEditBooking(b)
    setEditRouteId(b.route?.id || "")
    setEditPrice((b.priceFinal || b.priceCalculated).toString())
    setEditCarInfo(b.carInfo || "")
    setEditStatus(b.status)
    const matchedDriver = drivers.find(d => d.name === b.driverName)
    setEditDriverId(matchedDriver?.id || "")
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F5F0EB] py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-[#B8D4E3] space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-1/3" />
              </div>
            ))}
          </div>
          <TableSkeleton rows={5} cols={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Панель диспетчера
          </h1>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 border border-[#B8D4E3]">
              <div className="text-sm text-[#8B7355]">Сегодня</div>
              <div className="text-2xl font-bold text-[#1A2332]">{stats.today.total}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-[#B8D4E3]">
              <div className="text-sm text-[#8B7355]">Ожидают</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.today.pending}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-[#B8D4E3]">
              <div className="text-sm text-[#8B7355]">Выручка сегодня</div>
              <div className="text-2xl font-bold text-[#2D6A8F]">{stats.revenue.toLocaleString("ru")} ₽</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-[#B8D4E3]">
              <div className="text-sm text-[#8B7355]">За неделю</div>
              <div className="text-2xl font-bold text-[#1A2332]">{stats.week}</div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {statusOptions.map((opt) => (
            <button key={opt.value} onClick={() => { setFilterStatus(opt.value); setLoading(true); fetchBookings(opt.value) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === opt.value ? "bg-[#E8A838] text-[#1A2332]" : "bg-white text-[#1A2332] hover:bg-gray-100 border border-[#B8D4E3]"}`}>
              {opt.label}
            </button>
          ))}
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setLoading(true); fetchBookings(undefined, searchQuery) } }}
            placeholder="Поиск по телефону, имени, маршруту..." className="ml-auto px-4 py-2 border border-[#B8D4E3] rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white" />
        </div>

        <div className="bg-white rounded-lg border border-[#B8D4E3] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F0EB]">
                <tr>
                  {["ID", "Дата", "Маршрут", "Клиент", "Водитель", "Пассажиры", "Цена", "Статус", "Действия"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B8D4E3]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F5F0EB]/50">
                    <td className="px-4 py-3 text-sm font-mono text-[#8B7355]">{b.id.slice(-6)}</td>
                    <td className="px-4 py-3 text-sm">{new Date(b.datetime).toLocaleString("ru")}</td>
                    <td className="px-4 py-3 text-sm font-medium">{b.route.fromPoint} → {b.route.toPoint}</td>
                    <td className="px-4 py-3 text-sm">
                      {b.user.name && <div className="font-medium">{b.user.name}</div>}
                      <div className="text-[#8B7355]">{b.user.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {b.driverName ? (
                        <div>
                          <div className="font-medium">{b.driverName}</div>
                          {b.driverPhone && <div className="text-[#8B7355] text-xs">{b.driverPhone}</div>}
                        </div>
                      ) : <span className="text-[#B8D4E3]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">{b.passengers} чел.</td>
                    <td className="px-4 py-3 text-sm font-medium">{b.priceFinal || b.priceCalculated} ₽</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[b.status]}`}>{statusText[b.status]}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {b.status === "pending" && (
                          <button onClick={() => { setSelectedBooking(b); setPriceFinal(b.priceCalculated.toString()) }}
                            className="bg-[#E8A838] text-[#1A2332] px-2 py-1 rounded text-xs font-medium hover:bg-[#d49a30]">Назначить</button>
                        )}
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <button onClick={() => openEdit(b)}
                            className="bg-[#2D6A8F] text-white px-2 py-1 rounded text-xs font-medium hover:bg-[#245a7a]">Изменить</button>
                        )}
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <button onClick={() => handleCancel(b.id)} disabled={cancellingId === b.id}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-600 disabled:opacity-50">
                            {cancellingId === b.id ? "..." : "Отмена"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bookings.length === 0 && <div className="text-center py-12 text-[#8B7355]">Заявок пока нет</div>}
        </div>
      </div>

      {/* Confirm Modal (new booking) */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-[#B8D4E3]" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Назначение водителя
            </h2>
            <div className="bg-[#F5F0EB] p-3 rounded-lg mb-4 text-sm space-y-1">
              <p><strong>Маршрут:</strong> {selectedBooking.route.fromPoint} → {selectedBooking.route.toPoint}</p>
              <p><strong>Дата:</strong> {new Date(selectedBooking.datetime).toLocaleString("ru")}</p>
              <p><strong>Клиент:</strong> {selectedBooking.user.name && `${selectedBooking.user.name} — `}{selectedBooking.user.phone}</p>
              <p><strong>Пассажиры:</strong> {selectedBooking.passengers}</p>
              {selectedBooking.notes && <p><strong>Комментарий:</strong> {selectedBooking.notes}</p>}
            </div>
            <form onSubmit={handleConfirm} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#1A2332] mb-1">Водитель *</label>
                <select value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)}
                  className="w-full p-2 border border-[#B8D4E3] rounded-lg" required>
                  <option value="">Выберите водителя</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.carInfo}</option>
                  ))}
                </select>
                {drivers.length === 0 && <p className="text-xs text-red-500 mt-1">Нет доступных водителей</p>}
              </div>
              <input type="number" placeholder="Итоговая цена (руб)" value={priceFinal} onChange={e => setPriceFinal(e.target.value)}
                className="w-full p-2 border border-[#B8D4E3] rounded-lg" required />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={confirming} className="flex-1 bg-[#E8A838] text-[#1A2332] p-2 rounded-lg font-semibold hover:bg-[#d49a30] disabled:opacity-50">
                  {confirming ? "Отправка..." : "Назначить"}
                </button>
                <button type="button" onClick={() => setSelectedBooking(null)} className="flex-1 bg-gray-200 p-2 rounded-lg font-semibold hover:bg-gray-300">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditBooking(null)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-[#B8D4E3]" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Редактирование заявки
            </h2>
            <div className="bg-[#F5F0EB] p-3 rounded-lg mb-4 text-sm space-y-1">
              <p><strong>Клиент:</strong> {editBooking.user.name && `${editBooking.user.name} — `}{editBooking.user.phone}</p>
              <p><strong>Дата:</strong> {new Date(editBooking.datetime).toLocaleString("ru")}</p>
              <p><strong>Пассажиры:</strong> {editBooking.passengers}</p>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#1A2332] mb-1">Статус</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                  className="w-full p-2 border border-[#B8D4E3] rounded-lg">
                  <option value="pending">Ожидает</option>
                  <option value="confirmed">Подтверждена</option>
                  <option value="in_progress">В пути</option>
                  <option value="completed">Завершена</option>
                  <option value="cancelled">Отменена</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A2332] mb-1">Маршрут</label>
                <select value={editRouteId} onChange={e => setEditRouteId(e.target.value)}
                  className="w-full p-2 border border-[#B8D4E3] rounded-lg">
                  <option value="">Без изменений</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.fromPoint} → {r.toPoint} ({r.priceBase} ₽)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A2332] mb-1">Водитель</label>
                <select value={editDriverId} onChange={e => {
                  setEditDriverId(e.target.value)
                  const d = drivers.find(dr => dr.id === e.target.value)
                  if (d) setEditCarInfo(d.carInfo)
                }}
                  className="w-full p-2 border border-[#B8D4E3] rounded-lg">
                  <option value="">Без изменений</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.carInfo}</option>
                  ))}
                </select>
                {drivers.length === 0 && <p className="text-xs text-red-500 mt-1">Нет доступных водителей</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A2332] mb-1">Автомобиль</label>
                <input type="text" value={editCarInfo} onChange={e => setEditCarInfo(e.target.value)}
                  placeholder="Марка, модель, номер" className="w-full p-2 border border-[#B8D4E3] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A2332] mb-1">Цена (руб)</label>
                <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                  className="w-full p-2 border border-[#B8D4E3] rounded-lg" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={editing} className="flex-1 bg-[#E8A838] text-[#1A2332] p-2 rounded-lg font-semibold hover:bg-[#d49a30] disabled:opacity-50">
                  {editing ? "Сохранение..." : "Сохранить"}
                </button>
                <button type="button" onClick={() => setEditBooking(null)} className="flex-1 bg-gray-200 p-2 rounded-lg font-semibold hover:bg-gray-300">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
