"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/app/components/Toast"
import { useAuth } from "@/lib/useAuth"
import { Skeleton } from "@/app/components/Skeleton"
import Link from "next/link"

type CarClass = {
  id: string
  name: string
  coefficient: number
}

type Settings = {
  pricePerKm: number
  carClasses: CarClass[]
  extraPassengerPrice: number
  nightCoefficient: number
  nightHoursStart: number
  nightHoursEnd: number
}

const defaultCarClasses: CarClass[] = [
  { id: "economy", name: "Эконом", coefficient: 0.8 },
  { id: "comfort", name: "Комфорт", coefficient: 1.0 },
  { id: "comfort_plus", name: "Комфорт+", coefficient: 1.2 },
  { id: "business", name: "Бизнес", coefficient: 1.4 },
  { id: "minibus", name: "Микроавтобус", coefficient: 1.6 },
]

export default function AdminSettingsPage() {
  const { user, status: authStatus } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [pricePerKm, setPricePerKm] = useState(25)
  const [carClasses, setCarClasses] = useState<CarClass[]>(defaultCarClasses)
  const [extraPassengerPrice, setExtraPassengerPrice] = useState(300)
  const [nightCoefficient, setNightCoefficient] = useState(1.2)
  const [nightHoursStart, setNightHoursStart] = useState(23)
  const [nightHoursEnd, setNightHoursEnd] = useState(6)

  const [newClassName, setNewClassName] = useState("")
  const [newClassCoeff, setNewClassCoeff] = useState("")

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/auth/staff-login")
    else if (authStatus === "authenticated" && user?.role !== "admin") router.push("/")
  }, [authStatus, user, router])

  useEffect(() => {
    if (authStatus !== "authenticated") return
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then((data: Settings) => {
        setPricePerKm(data.pricePerKm)
        if (data.carClasses?.length) setCarClasses(data.carClasses)
        setExtraPassengerPrice(data.extraPassengerPrice)
        setNightCoefficient(data.nightCoefficient)
        setNightHoursStart(data.nightHoursStart)
        setNightHoursEnd(data.nightHoursEnd)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [authStatus])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricePerKm,
          carClasses,
          extraPassengerPrice,
          nightCoefficient,
          nightHoursStart,
          nightHoursEnd,
        }),
      })
      if (res.ok) toast("Настройки сохранены", "success")
      else toast("Ошибка сохранения", "error")
    } catch { toast("Ошибка сервера", "error") }
    finally { setSaving(false) }
  }

  const addCarClass = () => {
    if (!newClassName || !newClassCoeff) return
    setCarClasses([...carClasses, {
      id: newClassName.toLowerCase().replace(/\s+/g, "_"),
      name: newClassName,
      coefficient: parseFloat(newClassCoeff),
    }])
    setNewClassName("")
    setNewClassCoeff("")
  }

  const removeCarClass = (id: string) => {
    setCarClasses(carClasses.filter(c => c.id !== id))
  }

  const updateCarClass = (id: string, field: keyof CarClass, value: string | number) => {
    setCarClasses(carClasses.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F5F0EB] py-8">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin" className="text-[#2D6A8F] hover:text-[#1A2332] text-sm">← Назад</Link>
          <h1 className="text-3xl font-bold text-[#1A2332]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Настройки цен
          </h1>
        </div>

        {/* Price per km */}
        <div className="bg-white rounded-lg p-6 border border-[#B8D4E3] mb-6">
          <h2 className="text-xl font-semibold text-[#1A2332] mb-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Стоимость за километр
          </h2>
          <div className="flex items-center gap-4">
            <label className="text-sm text-[#8B7355]">Цена за 1 км:</label>
            <input type="number" value={pricePerKm} onChange={e => setPricePerKm(parseInt(e.target.value) || 0)}
              className="w-32 p-2 border border-[#B8D4E3] rounded-lg text-lg font-bold text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
            <span className="text-[#8B7355]">₽/км</span>
          </div>
        </div>

        {/* Car Classes */}
        <div className="bg-white rounded-lg p-6 border border-[#B8D4E3] mb-6">
          <h2 className="text-xl font-semibold text-[#1A2332] mb-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Классы автомобилей и коэффициенты
          </h2>
          <p className="text-sm text-[#8B7355] mb-4">Коэффициент умножается на базовую стоимость (км × цена × коэффициент)</p>

          <div className="space-y-3 mb-4">
            {carClasses.map(cc => (
              <div key={cc.id} className="flex items-center gap-3 p-3 bg-[#F5F0EB] rounded-lg">
                <input type="text" value={cc.name} onChange={e => updateCarClass(cc.id, "name", e.target.value)}
                  className="flex-1 p-2 border border-[#B8D4E3] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
                <div className="flex items-center gap-2">
                  <input type="number" step="0.1" min="0.1" max="5" value={cc.coefficient}
                    onChange={e => updateCarClass(cc.id, "coefficient", parseFloat(e.target.value) || 0)}
                    className="w-20 p-2 border border-[#B8D4E3] rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
                  <span className="text-sm text-[#8B7355]">×</span>
                </div>
                <div className="text-sm font-medium text-[#2D6A8F] w-20 text-right">
                  {Math.round(pricePerKm * cc.coefficient)} ₽/км
                </div>
                <button onClick={() => removeCarClass(cc.id)}
                  className="text-red-500 hover:text-red-700 text-sm px-2">✕</button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 items-end p-3 border border-dashed border-[#B8D4E3] rounded-lg">
            <input type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)}
              placeholder="Название класса" className="flex-1 p-2 border border-[#B8D4E3] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
            <input type="number" step="0.1" min="0.1" max="5" value={newClassCoeff}
              onChange={e => setNewClassCoeff(e.target.value)} placeholder="Коэфф."
              className="w-20 p-2 border border-[#B8D4E3] rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
            <button onClick={addCarClass}
              className="bg-[#E8A838] text-[#1A2332] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d49a30] transition">
              + Добавить
            </button>
          </div>
        </div>

        {/* Other settings */}
        <div className="bg-white rounded-lg p-6 border border-[#B8D4E3] mb-6">
          <h2 className="text-xl font-semibold text-[#1A2332] mb-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Доплаты и тарифы
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#8B7355] mb-1">Доплата за доп. пассажира (сверх 4)</label>
              <div className="flex items-center gap-2">
                <input type="number" value={extraPassengerPrice}
                  onChange={e => setExtraPassengerPrice(parseInt(e.target.value) || 0)}
                  className="w-24 p-2 border border-[#B8D4E3] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
                <span className="text-sm text-[#8B7355]">₽</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#8B7355] mb-1">Ночной коэффициент</label>
              <div className="flex items-center gap-2">
                <input type="number" step="0.1" min="1" max="3" value={nightCoefficient}
                  onChange={e => setNightCoefficient(parseFloat(e.target.value) || 1)}
                  className="w-24 p-2 border border-[#B8D4E3] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
                <span className="text-sm text-[#8B7355]">×</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#8B7355] mb-1">Начало ночного тарифа</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="23" value={nightHoursStart}
                  onChange={e => setNightHoursStart(parseInt(e.target.value) || 0)}
                  className="w-24 p-2 border border-[#B8D4E3] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
                <span className="text-sm text-[#8B7355]">час</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#8B7355] mb-1">Окончание ночного тарифа</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="23" value={nightHoursEnd}
                  onChange={e => setNightHoursEnd(parseInt(e.target.value) || 0)}
                  className="w-24 p-2 border border-[#B8D4E3] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A8F]" />
                <span className="text-sm text-[#8B7355]">час</span>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full bg-[#2D6A8F] text-white py-3 rounded-lg font-semibold hover:bg-[#245a7a] disabled:opacity-50 transition">
          {saving ? "Сохранение..." : "Сохранить настройки"}
        </button>
      </div>
    </div>
  )
}
