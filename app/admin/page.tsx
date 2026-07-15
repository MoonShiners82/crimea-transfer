"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "../components/Toast"

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
  user: { phone: string; name: string | null }
  route: { fromPoint: string; toPoint: string }
}

type Stats = {
  bookings: { total: number; pending: number; confirmed: number; completed: number; cancelled: number; today: number; week: number; month: number }
  revenue: { total: number; today: number; average: number }
  users: { total: number }
  popularRoutes: { fromPoint: string; toPoint: string; count: number }[]
  recentBookings: Booking[]
}

type Driver = {
  id: string
  userId: string | null
  name: string
  phone: string
  carInfo: string
  isActive: boolean
  status: string
  createdAt: string
}

const statusOptions = [
  { value: "", label: "Все" },
  { value: "pending", label: "Ожидают" },
  { value: "confirmed", label: "Подтверждённые" },
  { value: "completed", label: "Завершённые" },
  { value: "cancelled", label: "Отменённые" },
]

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
}

const statusText: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  completed: "Завершена",
}

export default function AdminPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [tab, setTab] = useState<"bookings" | "drivers" | "applications" | "dispatchers">("bookings")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [applications, setApplications] = useState<Driver[]>([])
  const [dispatchers, setDispatchers] = useState<{ id: string; phone: string; name: string | null; role: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showDashboard, setShowDashboard] = useState(true)

  // Confirm modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [driverName, setDriverName] = useState("")
  const [driverPhone, setDriverPhone] = useState("")
  const [carInfo, setCarInfo] = useState("")
  const [priceFinal, setPriceFinal] = useState("")
  const [confirming, setConfirming] = useState(false)

  // Edit modal
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [editPrice, setEditPrice] = useState("")
  const [editDriver, setEditDriver] = useState("")
  const [editDriverPhone, setEditDriverPhone] = useState("")
  const [editCarInfo, setEditCarInfo] = useState("")
  const [editing, setEditing] = useState(false)

  // Driver modal
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [newDriverName, setNewDriverName] = useState("")
  const [newDriverPhone, setNewDriverPhone] = useState("")
  const [newDriverCar, setNewDriverCar] = useState("")
  const [addingDriver, setAddingDriver] = useState(false)

  // Loading states
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)

  // Password modal
  const [passwordModalUser, setPasswordModalUser] = useState<{ id: string; phone: string; name: string | null } | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [settingPassword, setSettingPassword] = useState(false)

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set("status", filterStatus)
      if (searchQuery) params.set("search", searchQuery)
      const res = await fetch(`/api/admin/bookings${params.toString() ? `?${params.toString()}` : ""}`)
      if (res.status === 403) { router.push("/"); return }
      setBookings(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats")
      if (res.ok) setStats(await res.json())
    } catch (e) { console.error(e) }
  }

  const fetchDrivers = async () => {
    try {
      const res = await fetch("/api/admin/drivers")
      if (res.ok) setDrivers(await res.json())
    } catch (e) { console.error(e) }
  }

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/admin/drivers?status=pending")
      if (res.ok) setApplications(await res.json())
    } catch (e) { console.error(e) }
  }

  const handleApproveDriver = async (driverId: string) => {
    if (!confirm("Одобрить заявку водителя?")) return
    try {
      const res = await fetch("/api/admin/drivers/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId })
      })
      if (res.ok) { fetchApplications(); fetchDrivers(); toast("Водитель одобрен", "success") }
      else toast("Ошибка одобрения", "error")
    } catch { toast("Ошибка сервера", "error") }
  }

  const handleRejectDriver = async (driverId: string) => {
    if (!confirm("Отклонить заявку водителя?")) return
    try {
      const res = await fetch("/api/admin/drivers/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId })
      })
      if (res.ok) { fetchApplications(); toast("Заявка отклонена", "success") }
      else toast("Ошибка отклонения", "error")
    } catch { toast("Ошибка сервера", "error") }
  }

  const fetchDispatchers = async () => {
    try {
      const res = await fetch("/api/admin/dispatchers")
      if (res.ok) setDispatchers(await res.json())
    } catch (e) { console.error(e) }
  }

  const handleSetDispatcher = async (phone: string) => {
    if (!confirm(`Назначить ${phone} диспетчером?`)) return
    try {
      const res = await fetch("/api/admin/dispatchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      })
      if (res.ok) { fetchDispatchers(); toast("Диспетчер назначен", "success") }
      else {
        const data = await res.json()
        toast(data.error || "Ошибка", "error")
      }
    } catch { toast("Ошибка сервера", "error") }
  }

  const handleRemoveDispatcher = async (userId: string) => {
    if (!confirm("Снять полномочия диспетчера?")) return
    try {
      const res = await fetch(`/api/admin/dispatchers?id=${userId}`, { method: "DELETE" })
      if (res.ok) { fetchDispatchers(); toast("Полномочия сняты", "success") }
      else toast("Ошибка", "error")
    } catch { toast("Ошибка сервера", "error") }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordModalUser || !newPassword) return
    setSettingPassword(true)
    try {
      const res = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: passwordModalUser.id, password: newPassword })
      })
      if (res.ok) { setPasswordModalUser(null); setNewPassword(""); toast("Пароль установлен", "success") }
      else {
        const data = await res.json()
        toast(data.error || "Ошибка", "error")
      }
    } catch { toast("Ошибка сервера", "error") }
    finally { setSettingPassword(false) }
  }

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/auth/signin")
    else if (authStatus === "authenticated" && session?.user?.role !== "admin") router.push("/")
  }, [authStatus, session, router])

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchBookings()
      fetchStats()
      fetchDrivers()
      fetchApplications()
      fetchDispatchers()
    }
  }, [authStatus])

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return
    setConfirming(true)
    try {
      const res = await fetch("/api/admin/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: selectedBooking.id, driverName, driverPhone, carInfo, priceFinal: parseInt(priceFinal) })
      })
      if (res.ok) { setSelectedBooking(null); fetchBookings(); fetchStats(); toast("Заявка подтверждена", "success") }
      else toast("Ошибка подтверждения", "error")
    } catch { toast("Ошибка сервера", "error") }
    finally { setConfirming(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBooking) return
    setEditing(true)
    try {
      const res = await fetch("/api/admin/bookings/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: editingBooking.id, priceFinal: parseInt(editPrice), driverName: editDriver, driverPhone: editDriverPhone, carInfo: editCarInfo })
      })
      if (res.ok) { setEditingBooking(null); fetchBookings(); toast("Сохранено", "success") }
      else toast("Ошибка сохранения", "error")
    } catch { toast("Ошибка сервера", "error") }
    finally { setEditing(false) }
  }

  const handleStatus = async (bookingId: string, newStatus: string) => {
    if (!confirm(`Изменить статус на "${statusText[newStatus]}"?`)) return
    const setter = newStatus === "completed" ? setCompletingId : setCancellingId
    setter(bookingId)
    try {
      const res = await fetch("/api/admin/bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus })
      })
      if (res.ok) { fetchBookings(); fetchStats(); toast("Статус обновлён", "success") }
      else toast("Ошибка смены статуса", "error")
    } catch { toast("Ошибка сервера", "error") }
    finally { setter(null) }
  }

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingDriver(true)
    try {
      const res = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDriverName, phone: newDriverPhone, carInfo: newDriverCar })
      })
      if (res.ok) { setShowDriverModal(false); setNewDriverName(""); setNewDriverPhone(""); setNewDriverCar(""); fetchDrivers(); toast("Водитель добавлен", "success") }
      else toast("Ошибка добавления", "error")
    } catch { toast("Ошибка сервера", "error") }
    finally { setAddingDriver(false) }
  }

  const handleDeleteDriver = async (id: string) => {
    if (!confirm("Удалить водителя?")) return
    try {
      const res = await fetch(`/api/admin/drivers?id=${id}`, { method: "DELETE" })
      if (res.ok) { fetchDrivers(); toast("Водитель удалён", "success") }
    } catch { toast("Ошибка удаления", "error") }
  }

  const handleExport = async (format: "csv" | "json") => {
    const params = new URLSearchParams()
    if (filterStatus) params.set("status", filterStatus)
    if (searchQuery) params.set("search", searchQuery)
    params.set("format", format)
    window.open(`/api/admin/export?${params.toString()}`, "_blank")
  }

  if (authStatus === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F5F0EB]"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A8F] border-t-transparent"></div></div>
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Админ-панель</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowDashboard(!showDashboard)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${showDashboard ? "bg-[#2D6A8F] text-white" : "bg-white text-[#1A2332] hover:bg-gray-100 border border-[#B8D4E3]"}`}>
              {showDashboard ? "Скрыть статистику" : "Показать статистику"}
            </button>
            <Link href="/" className="bg-white text-[#1A2332] px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 border border-[#B8D4E3] transition">На главную</Link>
          </div>
        </div>

        {/* Dashboard */}
        {showDashboard && stats && (
          <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-[#B8D4E3]">
              <div className="text-sm text-[#8B7355]">Всего заявок</div>
              <div className="text-2xl font-bold text-[#1A2332]">{stats.bookings.total}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-[#B8D4E3]">
              <div className="text-sm text-[#8B7355]">Ожидают</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.bookings.pending}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-[#B8D4E3]">
              <div className="text-sm text-[#8B7355]">Выручка</div>
              <div className="text-2xl font-bold text-[#2D6A8F]">{stats.revenue.total.toLocaleString("ru")} ₽</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-[#B8D4E3]">
              <div className="text-sm text-[#8B7355]">Пользователей</div>
              <div className="text-2xl font-bold text-[#1A2332]">{stats.users.total}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setTab("bookings")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "bookings" ? "bg-[#1A2332] text-white" : "bg-white text-[#1A2332] hover:bg-gray-100 border border-[#B8D4E3]"}`}>Заявки</button>
          <button onClick={() => setTab("drivers")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "drivers" ? "bg-[#1A2332] text-white" : "bg-white text-[#1A2332] hover:bg-gray-100 border border-[#B8D4E3]"}`}>Водители</button>
          <button onClick={() => setTab("applications")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "applications" ? "bg-[#1A2332] text-white" : "bg-white text-[#1A2332] hover:bg-gray-100 border border-[#B8D4E3]"}`}>
            Заявки водителей {applications.length > 0 && <span className="ml-1 bg-[#E8A838] text-[#1A2332] px-1.5 py-0.5 rounded-full text-xs">{applications.length}</span>}
          </button>
          <button onClick={() => setTab("dispatchers")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "dispatchers" ? "bg-[#1A2332] text-white" : "bg-white text-[#1A2332] hover:bg-gray-100 border border-[#B8D4E3]"}`}>Диспетчеры</button>
          <div className="ml-auto flex gap-2">
            <button onClick={() => handleExport("csv")} className="bg-white text-[#1A2332] px-3 py-2 rounded-lg text-sm hover:bg-gray-100 border border-[#B8D4E3] transition">📥 CSV</button>
            <button onClick={() => handleExport("json")} className="bg-white text-[#1A2332] px-3 py-2 rounded-lg text-sm hover:bg-gray-100 border border-[#B8D4E3] transition">📥 JSON</button>
          </div>
        </div>

        {/* Bookings Tab */}
        {tab === "bookings" && (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {statusOptions.map((opt) => (
                <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === opt.value ? "bg-[#E8A838] text-[#1A2332]" : "bg-white text-[#1A2332] hover:bg-gray-100 border border-[#B8D4E3]"}`}>
                  {opt.label}
                </button>
              ))}
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
                          {b.driverName ? <div><div className="font-medium">{b.driverName}</div>{b.driverPhone && <div className="text-[#8B7355] text-xs">{b.driverPhone}</div>}</div> : <span className="text-[#B8D4E3]">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm">{b.passengers} чел.</td>
                        <td className="px-4 py-3 text-sm font-medium">{b.priceFinal || b.priceCalculated} ₽</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[b.status]}`}>{statusText[b.status]}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {b.status === "pending" && (
                              <button onClick={() => { setSelectedBooking(b); setPriceFinal(b.priceCalculated.toString()) }}
                                className="bg-[#E8A838] text-[#1A2332] px-2 py-1 rounded text-xs font-medium hover:bg-[#d49a30]">Подтвердить</button>
                            )}
                            {b.status === "confirmed" && (
                              <button onClick={() => handleStatus(b.id, "completed")} disabled={completingId === b.id}
                                className="bg-[#2D6A8F] text-white px-2 py-1 rounded text-xs font-medium hover:bg-[#245a7a] disabled:opacity-50">
                                {completingId === b.id ? "..." : "Завершить"}
                              </button>
                            )}
                            {(b.status === "pending" || b.status === "confirmed") && (
                              <button onClick={() => handleStatus(b.id, "cancelled")} disabled={cancellingId === b.id}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-600 disabled:opacity-50">
                                {cancellingId === b.id ? "..." : "Отмена"}
                              </button>
                            )}
                            {b.status !== "cancelled" && (
                              <button onClick={() => { setEditingBooking(b); setEditPrice((b.priceFinal || b.priceCalculated).toString()); setEditDriver(b.driverName || ""); setEditDriverPhone(b.driverPhone || ""); setEditCarInfo(b.carInfo || "") }}
                                className="bg-gray-200 text-[#1A2332] px-2 py-1 rounded text-xs font-medium hover:bg-gray-300">✏️</button>
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
          </>
        )}

        {/* Drivers Tab */}
        {tab === "drivers" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Водители</h2>
              <button onClick={() => setShowDriverModal(true)} className="bg-[#E8A838] text-[#1A2332] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d49a30] transition">+ Добавить водителя</button>
            </div>
            <div className="bg-white rounded-lg border border-[#B8D4E3] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#F5F0EB]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Имя</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Телефон</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Автомобиль</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Статус</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Пароль</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B8D4E3]">
                  {drivers.map((d) => (
                    <tr key={d.id} className="hover:bg-[#F5F0EB]/50">
                      <td className="px-4 py-3 text-sm font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-sm">{d.phone}</td>
                      <td className="px-4 py-3 text-sm">{d.carInfo}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${d.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{d.isActive ? "Активен" : "Неактивен"}</span></td>
                      <td className="px-4 py-3">
                        {d.userId ? (
                          <button onClick={() => { setPasswordModalUser({ id: d.userId!, phone: d.phone, name: d.name }); setNewPassword("") }}
                            className="bg-[#2D6A8F] text-white px-2 py-1 rounded text-xs font-medium hover:bg-[#245a7a]">Пароль</button>
                        ) : (
                          <span className="text-xs text-[#8B7355]">Нет аккаунта</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteDriver(d.id)} className="text-red-500 hover:text-red-700 text-sm">Удалить</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {drivers.length === 0 && <div className="text-center py-12 text-[#8B7355]">Водителей пока нет. Добавьте первого!</div>}
            </div>
          </>
        )}

        {/* Applications Tab */}
        {tab === "applications" && (
          <>
            <h2 className="text-xl font-semibold text-[#1A2332] mb-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Заявки водителей</h2>
            <div className="bg-white rounded-lg border border-[#B8D4E3] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#F5F0EB]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Фото</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Имя</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Телефон</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Автомобиль</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Дата</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B8D4E3]">
                  {applications.map((d) => (
                    <tr key={d.id} className="hover:bg-[#F5F0EB]/50">
                      <td className="px-4 py-3">
                        {d.photoUrl ? (
                          <img src={d.photoUrl} alt={d.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#2D6A8F] text-white flex items-center justify-center font-bold">
                            {d.name.charAt(0)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-sm">{d.phone}</td>
                      <td className="px-4 py-3 text-sm">{d.carInfo}</td>
                      <td className="px-4 py-3 text-sm text-[#8B7355]">{new Date(d.createdAt).toLocaleDateString("ru")}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveDriver(d.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-600">Одобрить</button>
                          <button onClick={() => handleRejectDriver(d.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-600">Отклонить</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {applications.length === 0 && <div className="text-center py-12 text-[#8B7355]">Новых заявок нет</div>}
            </div>
          </>
        )}

        {/* Dispatchers Tab */}
        {tab === "dispatchers" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Диспетчеры</h2>
              <div className="flex gap-2">
                <input type="tel" placeholder="Телефон диспетчера" id="dispatcherPhone"
                  className="px-4 py-2 border border-[#B8D4E3] rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white" />
                <button onClick={() => {
                  const input = document.getElementById("dispatcherPhone") as HTMLInputElement
                  if (input.value) { handleSetDispatcher(input.value); input.value = "" }
                }} className="bg-[#E8A838] text-[#1A2332] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d49a30] transition">
                  + Назначить диспетчера
                </button>
              </div>
            </div>
            <p className="text-sm text-[#8B7355] mb-4">Пользователь должен быть зарегистрирован на сайте (войти хотя бы раз)</p>
            <div className="bg-white rounded-lg border border-[#B8D4E3] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#F5F0EB]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Телефон</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Имя</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Роль</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B8D4E3]">
                  {dispatchers.map((d) => (
                    <tr key={d.id} className="hover:bg-[#F5F0EB]/50">
                      <td className="px-4 py-3 text-sm">{d.phone}</td>
                      <td className="px-4 py-3 text-sm font-medium">{d.name || "—"}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">Диспетчер</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => { setPasswordModalUser(d); setNewPassword("") }}
                            className="bg-[#2D6A8F] text-white px-2 py-1 rounded text-xs font-medium hover:bg-[#245a7a]">Пароль</button>
                          <button onClick={() => handleRemoveDispatcher(d.id)} className="text-red-500 hover:text-red-700 text-sm">Снять</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dispatchers.length === 0 && <div className="text-center py-12 text-[#8B7355]">Диспетчеров пока нет</div>}
            </div>
          </>
        )}
      </div>

      {/* Confirm Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-[#B8D4E3]" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Подтверждение заявки #{selectedBooking.id.slice(-6)}</h2>
            <div className="bg-[#F5F0EB] p-3 rounded-lg mb-4 text-sm space-y-1">
              <p><strong>Маршрут:</strong> {selectedBooking.route.fromPoint} → {selectedBooking.route.toPoint}</p>
              <p><strong>Дата:</strong> {new Date(selectedBooking.datetime).toLocaleString("ru")}</p>
              <p><strong>Клиент:</strong> {selectedBooking.user.name && `${selectedBooking.user.name} — `}{selectedBooking.user.phone}</p>
              <p><strong>Пассажиры:</strong> {selectedBooking.passengers}</p>
            </div>
            <form onSubmit={handleConfirm} className="space-y-3">
              <input type="text" placeholder="Имя водителя" value={driverName} onChange={e => setDriverName(e.target.value)} className="w-full p-2 border border-[#B8D4E3] rounded-lg" required />
              <input type="tel" placeholder="Телефон водителя" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} className="w-full p-2 border border-[#B8D4E3] rounded-lg" required />
              <input type="text" placeholder="Автомобиль" value={carInfo} onChange={e => setCarInfo(e.target.value)} className="w-full p-2 border border-[#B8D4E3] rounded-lg" required />
              <input type="number" placeholder="Итоговая цена (руб)" value={priceFinal} onChange={e => setPriceFinal(e.target.value)} className="w-full p-2 border border-[#B8D4E3] rounded-lg" required />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={confirming} className="flex-1 bg-[#E8A838] text-[#1A2332] p-2 rounded-lg font-semibold hover:bg-[#d49a30] disabled:opacity-50">{confirming ? "Отправка..." : "Подтвердить"}</button>
                <button type="button" onClick={() => setSelectedBooking(null)} className="flex-1 bg-gray-200 p-2 rounded-lg font-semibold hover:bg-gray-300">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditingBooking(null)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-[#B8D4E3]" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Редактирование #{editingBooking.id.slice(-6)}</h2>
            <div className="bg-[#F5F0EB] p-3 rounded-lg mb-4 text-sm">
              <p><strong>Маршрут:</strong> {editingBooking.route.fromPoint} → {editingBooking.route.toPoint}</p>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <input type="text" placeholder="Имя водителя" value={editDriver} onChange={e => setEditDriver(e.target.value)} className="w-full p-2 border border-[#B8D4E3] rounded-lg" />
              <input type="tel" placeholder="Телефон водителя" value={editDriverPhone} onChange={e => setEditDriverPhone(e.target.value)} className="w-full p-2 border border-[#B8D4E3] rounded-lg" />
              <input type="text" placeholder="Автомобиль" value={editCarInfo} onChange={e => setEditCarInfo(e.target.value)} className="w-full p-2 border border-[#B8D4E3] rounded-lg" />
              <input type="number" placeholder="Цена (руб)" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full p-2 border border-[#B8D4E3] rounded-lg" required />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={editing} className="flex-1 bg-[#2D6A8F] text-white p-2 rounded-lg font-semibold hover:bg-[#245a7a] disabled:opacity-50">{editing ? "Сохранение..." : "Сохранить"}</button>
                <button type="button" onClick={() => setEditingBooking(null)} className="flex-1 bg-gray-200 p-2 rounded-lg font-semibold hover:bg-gray-300">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDriverModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-[#B8D4E3]" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Новый водитель</h2>
            <form onSubmit={handleAddDriver} className="space-y-3">
              <input type="text" placeholder="ФИО" value={newDriverName} onChange={e => setNewDriverName(e.target.value)} className="w-full p-2 border border-[#B8D4E3] rounded-lg" required />
              <input type="tel" placeholder="Телефон" value={newDriverPhone} onChange={e => setNewDriverPhone(e.target.value)} className="w-full p-2 border border-[#B8D4E3] rounded-lg" required />
              <input type="text" placeholder="Автомобиль" value={newDriverCar} onChange={e => setNewDriverCar(e.target.value)} className="w-full p-2 border border-[#B8D4E3] rounded-lg" required />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={addingDriver} className="flex-1 bg-[#E8A838] text-[#1A2332] p-2 rounded-lg font-semibold hover:bg-[#d49a30] disabled:opacity-50">{addingDriver ? "Добавление..." : "Добавить"}</button>
                <button type="button" onClick={() => setShowDriverModal(false)} className="flex-1 bg-gray-200 p-2 rounded-lg font-semibold hover:bg-gray-300">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setPasswordModalUser(null)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-[#B8D4E3]" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Установить пароль</h2>
            <p className="text-sm text-[#8B7355] mb-4">
              {passwordModalUser.name || passwordModalUser.phone}
            </p>
            <form onSubmit={handleSetPassword} className="space-y-3">
              <input type="password" placeholder="Новый пароль (мин. 6 символов)" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full p-2 border border-[#B8D4E3] rounded-lg" required minLength={6} autoFocus />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={settingPassword} className="flex-1 bg-[#E8A838] text-[#1A2332] p-2 rounded-lg font-semibold hover:bg-[#d49a30] disabled:opacity-50">
                  {settingPassword ? "Сохранение..." : "Сохранить"}
                </button>
                <button type="button" onClick={() => setPasswordModalUser(null)} className="flex-1 bg-gray-200 p-2 rounded-lg font-semibold hover:bg-gray-300">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
