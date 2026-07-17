"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("bookingId")

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bookingId) {
      setError("bookingId is required")
      setLoading(false)
      return
    }

    fetch(`/api/bookings/${bookingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setBooking(data)
        }
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load booking")
        setLoading(false)
      })
  }, [bookingId])

  const handlePayment = async () => {
    if (!bookingId) return

    setPaying(true)
    setError(null)

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setPaying(false)
        return
      }

      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl
      }
    } catch {
      setError("Failed to create payment")
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Бронирование не найдено</div>
      </div>
    )
  }

  const amount = booking.priceFinal || booking.priceCalculated

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Оплата бронирования</h1>

        <div className="space-y-4 mb-6">
          <div className="border-b pb-2">
            <div className="text-sm text-gray-500">Маршрут</div>
            <div className="font-medium">
              {booking.route?.fromPoint} → {booking.route?.toPoint}
            </div>
          </div>

          <div className="border-b pb-2">
            <div className="text-sm text-gray-500">Дата и время</div>
            <div className="font-medium">
              {new Date(booking.datetime).toLocaleString("ru-RU")}
            </div>
          </div>

          <div className="border-b pb-2">
            <div className="text-sm text-gray-500">Пассажиры</div>
            <div className="font-medium">{booking.passengers}</div>
          </div>

          <div className="border-b pb-2">
            <div className="text-sm text-gray-500">Багаж</div>
            <div className="font-medium">{booking.baggageType}</div>
          </div>

          {booking.notes && (
            <div className="border-b pb-2">
              <div className="text-sm text-gray-500">Примечания</div>
              <div className="font-medium">{booking.notes}</div>
            </div>
          )}

          <div className="pt-4">
            <div className="text-sm text-gray-500">Сумма к оплате</div>
            <div className="text-3xl font-bold text-blue-600">
              {amount.toLocaleString("ru-RU")} ₽
            </div>
          </div>
        </div>

        {booking.paymentStatus === "paid" ? (
          <div className="text-center py-4 text-green-600 font-medium">
            Оплачено
          </div>
        ) : (
          <button
            onClick={handlePayment}
            disabled={paying}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paying ? "Обработка..." : "Оплатить"}
          </button>
        )}

        <button
          onClick={() => router.back()}
          className="w-full mt-4 text-gray-600 py-2 px-4 rounded-lg font-medium hover:bg-gray-100"
        >
          Назад
        </button>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-lg">Загрузка...</div></div>}>
      <PaymentContent />
    </Suspense>
  )
}
