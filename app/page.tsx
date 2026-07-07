"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"

export default function Home() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Трансфер по Крыму
          </h1>
          <p className="text-xl text-gray-600">
            Комфортные поездки из аэропорта Симферополя
          </p>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-8">
          {session?.user ? (
            <>
              <h2 className="text-2xl font-semibold mb-6 text-center">
                Добро пожаловать!
              </h2>
              <p className="text-gray-600 text-center mb-8">
                {(session.user as any).phone}
              </p>
              <div className="flex gap-4">
                <Link
                  href="/booking"
                  className="flex-1 bg-blue-600 text-white text-center p-4 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Забронировать трансфер
                </Link>
                <Link
                  href="/bookings"
                  className="flex-1 bg-gray-100 text-gray-700 text-center p-4 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Мои бронирования
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold mb-6 text-center">
                Быстрое бронирование
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mr-4">
                    1
                  </div>
                  <p>Выберите маршрут и дату</p>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mr-4">
                    2
                  </div>
                  <p>Укажите количество пассажиров и багаж</p>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mr-4">
                    3
                  </div>
                  <p>Получите подтверждение от диспетчера</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Link
                  href="/auth/signin"
                  className="flex-1 bg-blue-600 text-white text-center p-4 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Забронировать
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p>Поддержка 24/7: +7 (978) 123-45-67</p>
        </div>
      </div>
    </div>
  )
}
