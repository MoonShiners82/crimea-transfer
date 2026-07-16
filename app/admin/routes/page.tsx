"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/app/components/Toast"
import { useAuth } from "@/lib/useAuth"
import { Skeleton, TableSkeleton } from "@/app/components/Skeleton"
import Link from "next/link"

type RouteItem = {
  id: string
  fromPoint: string
  toPoint: string
  distanceKm: number
  durationMin: number
  pricePerBaggage: number
  isActive: boolean
}

export default function AdminRoutesPage() {
  const { user, status: authStatus } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pricePerKm, setPricePerKm] = useState(25)

  const [showForm, setShowForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RouteItem | null>(null)
  const [formFrom, setFormFrom] = useState("")
  const [formTo, setFormTo] = useState("")
  const [formDistance, setFormDistance] = useState("")
  const [formDuration, setFormDuration] = useState("")
  const [formBaggage, setFormBaggage] = useState("200")
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/auth/staff-login")
    else if (authStatus === "authenticated" && user?.role !== "admin") router.push("/")
  }, [authStatus, user, router])

  useEffect(() => {
    if (authStatus !== "authenticated") return
    Promise.all([
      fetch("/api/admin/routes").then(r => r.json()),
      fetch("/api/admin/settings").then(r => r.json()),
    ]).then(([routesData, settings]) => {
      setRoutes(routesData)
      if (settings.pricePerKm) setPricePerKm(settings.pricePerKm)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [authStatus])

  const openAdd = () => {
    setEditingRoute(null)
    setFormFrom("")
    setFormTo("")
    setFormDistance("")
    setFormDuration("")
    setFormBaggage("200")
    setFormActive(true)
    setShowForm(true)
  }

  const openEdit = (r: RouteItem) => {
    setEditingRoute(r)
    setFormFrom(r.fromPoint)
    setFormTo(r.toPoint)
    setFormDistance(String(r.distanceKm))
    setFormDuration(String(r.durationMin))
    setFormBaggage(String(r.pricePerBaggage))
    setFormActive(r.isActive)
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        id: editingRoute?.id,
        fromPoint: formFrom,
        toPoint: formTo,
        distanceKm: formDistance,
        durationMin: formDuration || String(Math.round(parseFloat(formDistance) * 1.5)),
        pricePerBaggage: formBaggage,
        isActive: formActive,
      }
      const method = editingRoute ? "PUT" : "POST"
      const res = await fetch("/api/admin/routes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast(editingRoute ? "Маршрут обновлён" : "Маршрут добавлен", "success")
        setShowForm(false)
        const updated = await fetch("/api/admin/routes").then(r => r.json())
        setRoutes(updated)
      } else {
        const data = await res.json()
        toast(data.error || "Ошибка", "error")
      }
    } catch { toast("Ошибка сервера", "error") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить маршрут?")) return
    try {
      const res = await fetch(`/api/admin/routes?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setRoutes(routes.filter(r => r.id !== id))
        toast("Маршрут удалён", "success")
      } else {
        const data = await res.json()
        toast(data.error || "Ошибка", "error")
      }
    } catch { toast("Ошибка сервера", "error") }
  }

  const toggleActive = async (r: RouteItem) => {
    try {
      const res = await fetch("/api/admin/routes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, isActive: !r.isActive }),
      })
      if (res.ok) {
        setRoutes(routes.map(route => route.id === r.id ? { ...route, isActive: !route.isActive } : route))
        toast(r.isActive ? "Маршрут деактивирован" : "Маршрут активирован", "success")
      }
    } catch { toast("Ошибка сервера", "error") }
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F5F0EB] py-8">
        <div className="max-w-5xl mx-auto px-4 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <TableSkeleton rows={5} cols={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#2D6A8F] hover:text-[#1A2332] text-sm">← Назад</Link>
            <h1 className="text-3xl font-bold text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Маршруты
            </h1>
          </div>
          <button onClick={openAdd}
            className="bg-[#E8A838] text-[#1A2332] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d49a30] transition">
            + Добавить маршрут
          </button>
        </div>

        <div className="bg-white rounded-lg border border-[#B8D4E3] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F0EB]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Откуда</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Куда</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Расстояние</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Время</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Багаж</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Статус</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A2332]">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B8D4E3]">
                {routes.map(r => (
                  <tr key={r.id} className="hover:bg-[#F5F0EB]/50">
                    <td className="px-4 py-3 text-sm font-medium">{r.fromPoint}</td>
                    <td className="px-4 py-3 text-sm font-medium">{r.toPoint}</td>
                    <td className="px-4 py-3 text-sm">{r.distanceKm} км</td>
                    <td className="px-4 py-3 text-sm">~{r.durationMin} мин</td>
                    <td className="px-4 py-3 text-sm">{r.pricePerBaggage} ₽</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(r)}
                        className={`px-2 py-1 rounded text-xs font-medium ${r.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {r.isActive ? "Активен" : "Неактивен"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(r)}
                          className="bg-[#2D6A8F] text-white px-2 py-1 rounded text-xs font-medium hover:bg-[#245a7a]">Изменить</button>
                        <button onClick={() => handleDelete(r.id)}
                          className="text-red-500 hover:text-red-700 text-sm">Удалить</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {routes.length === 0 && <div className="text-center py-12 text-[#8B7355]">Маршрутов пока нет</div>}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-lg max-w-md w-full p-6 border border-[#B8D4E3]" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4 text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                {editingRoute ? "Редактировать маршрут" : "Новый маршрут"}
              </h2>
              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#1A2332] mb-1">Откуда *</label>
                  <input type="text" value={formFrom} onChange={e => setFormFrom(e.target.value)} required
                    placeholder="Аэропорт Симферополь" className="w-full p-2 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2332] mb-1">Куда *</label>
                  <input type="text" value={formTo} onChange={e => setFormTo(e.target.value)} required
                    placeholder="Ялта, центр" className="w-full p-2 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332] mb-1">Расстояние (км) *</label>
                    <input type="number" min="1" value={formDistance} onChange={e => setFormDistance(e.target.value)} required
                      className="w-full p-2 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332] mb-1">Время (мин)</label>
                    <input type="number" min="1" value={formDuration} onChange={e => setFormDuration(e.target.value)}
                      placeholder={formDistance ? String(Math.round(parseFloat(formDistance) * 1.5)) : ""}
                      className="w-full p-2 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2332] mb-1">Доплата за багаж (₽)</label>
                  <input type="number" min="0" value={formBaggage} onChange={e => setFormBaggage(e.target.value)}
                    className="w-full p-2 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)}
                    className="h-4 w-4 text-[#2D6A8F] border-[#B8D4E3] rounded" />
                  <span className="text-sm text-[#1A2332]">Активен (доступен для бронирования)</span>
                </label>

                {formDistance && (
                  <div className="bg-[#F5F0EB] p-3 rounded-lg text-sm">
                    <span className="text-[#8B7355]">Примерная стоимость (Эконом): </span>
                    <span className="font-bold text-[#2D6A8F]">{Math.round(parseFloat(formDistance) * pricePerKm * 0.8)} ₽</span>
                    <span className="text-[#8B7355]"> · (Бизнес): </span>
                    <span className="font-bold text-[#2D6A8F]">{Math.round(parseFloat(formDistance) * pricePerKm * 1.4)} ₽</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-[#E8A838] text-[#1A2332] p-2 rounded-lg font-semibold hover:bg-[#d49a30] disabled:opacity-50">
                    {saving ? "Сохранение..." : editingRoute ? "Сохранить" : "Добавить"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-200 p-2 rounded-lg font-semibold hover:bg-gray-300">Отмена</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
