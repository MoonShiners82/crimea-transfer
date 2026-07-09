"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"

export default function Home() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#1A2332] via-[#2D6A8F] to-[#B8D4E3] text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Трансфер по Крыму
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto">
            Комфортные поездки из аэропорта Симферополя в любой точке полуострова
          </p>
          <Link
            href={session?.user ? "/booking" : "/auth/signin"}
            className="inline-block bg-[#E8A838] text-[#1A2332] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#d49a30] transition shadow-lg"
          >
            Забронировать трансфер
          </Link>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Как это работает
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2D6A8F] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Выберите маршрут</h3>
              <p className="text-[#8B7355]">Укажите откуда и куда, дату и количество пассажиров</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2D6A8F] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Получите подтверждение</h3>
              <p className="text-[#8B7355]">Диспетчер свяжется с вами для уточнения деталей</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2D6A8F] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Комфортная поездка</h3>
              <p className="text-[#8B7355]">Водитель встретит вас в аэропорту и доставит по назначению</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Почему выбирают нас
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-[#F5F0EB] p-6 rounded-lg">
              <div className="text-3xl mb-3">🚗</div>
              <h3 className="font-semibold mb-2">Комфортные авто</h3>
              <p className="text-sm text-[#8B7355]">Современные автомобили с кондиционером</p>
            </div>
            <div className="bg-[#F5F0EB] p-6 rounded-lg">
              <div className="text-3xl mb-3">⏱️</div>
              <h3 className="font-semibold mb-2">Вовремя</h3>
              <p className="text-sm text-[#8B7355]">Водитель всегда ждёт вас в аэропорту</p>
            </div>
            <div className="bg-[#F5F0EB] p-6 rounded-lg">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-semibold mb-2">Фиксированная цена</h3>
              <p className="text-sm text-[#8B7355]">Никаких скрытых платежей и доплат</p>
            </div>
            <div className="bg-[#F5F0EB] p-6 rounded-lg">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-semibold mb-2">Онлайн-бронирование</h3>
              <p className="text-sm text-[#8B7355]">Забронируйте за 2 минуты через сайт</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Готовы к поездке?
          </h2>
          <p className="text-[#8B7355] text-lg mb-8 max-w-xl mx-auto">
            Забронируйте трансфер прямо сейчас и получите скидку 10% на первую поездку
          </p>
          <Link
            href={session?.user ? "/booking" : "/auth/signin"}
            className="inline-block bg-[#E8A838] text-[#1A2332] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#d49a30] transition shadow-lg"
          >
            Забронировать со скидкой
          </Link>
        </div>
      </section>
    </div>
  )
}
