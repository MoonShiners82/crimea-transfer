"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/useAuth"
import PriceCalculator from "./components/PriceCalculator"

const faqItems = [
  {
    q: "Как забронировать трансфер?",
    a: "Выберите маршрут, укажите дату, время и количество пассажиров. После отправки заявки диспетчер свяжется с вами для подтверждения."
  },
  {
    q: "Можно ли отменить бронирование?",
    a: "Да, вы можете отменить бронирование, связавшись с диспетчером по телефону. При отмене менее чем за 24 часа взимается комиссия 50%."
  },
  {
    q: "Какие автомобили используются?",
    a: "Мы используем современные автомобили класса Comfort и Business: седаны, минивэны и SUV с кондиционером и кондиционером."
  },
  {
    q: "Водитель будет ждать в аэропорту?",
    a: "Да, водитель встречает вас в зоне прилёта с табличкой. Время ожидания после посадки — до 60 минут бесплатно."
  },
  {
    q: "Как формируется цена?",
    a: "Цена фиксированная и зависит от маршрута. Доплата за пассажиров сверх 4 человек и за багаж. Ночной тариф (23:00–06:00) — +20%."
  },
  {
    q: "Можно ли оплатить картой?",
    a: "Да, вы можете оплатить наличными водителю или картой через ссылку, которую пришлёт диспетчер."
  }
]

interface Review {
  id: string
  name: string
  text: string
  rating: number
}

const fallbackReviews: Review[] = [
  {
    id: "1",
    name: "Алексей М.",
    text: "Отличный сервис! Водитель встретил в аэропорту с табличкой, машина чистая и комфортная. Доехали быстро, несмотря на сезон.",
    rating: 5
  },
  {
    id: "2",
    name: "Елена К.",
    text: "Пользуюсь сервисом второй раз. Всё чётко, водители вежливые. Цена как обещали — без доплат. Рекомендую!",
    rating: 5
  },
  {
    id: "3",
    name: "Дмитрий П.",
    text: "Забронировал для семьи с двумя детьми. Водитель помог с багажом, посадил детей в автокресло. Очень довольны!",
    rating: 5
  }
]

export default function Home() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>(fallbackReviews)

  useEffect(() => {
    fetch("/api/reviews")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setReviews(data)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#1A2332] via-[#2D6A8F] to-[#B8D4E3] text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Трансфер по Крыму
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto">
            Комфортные поездки в любую точку полуострова
          </p>
          <Link
            href={user ? "/booking" : "/auth/login"}
            className="inline-block bg-[#E8A838] text-[#1A2332] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#d49a30] transition shadow-lg"
          >
            Забронировать трансфер
          </Link>
        </div>
      </section>

      {/* Price Calculator */}
      <section className="py-16 md:py-24 bg-[#F5F0EB]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Узнайте стоимость сразу
          </h2>
          <p className="text-[#8B7355] text-center mb-8 max-w-lg mx-auto">
            Выберите маршрут и рассчитайте цену за 30 секунд
          </p>
          <PriceCalculator />
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

      {/* Reviews Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Отзывы клиентов
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {reviews.map((review, i) => (
              <div key={i} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <span key={j} className="text-[#E8A838]">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 text-sm leading-relaxed">{review.text}</p>
                <div className="border-t pt-3">
                  <p className="font-semibold text-sm">{review.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Часто задаваемые вопросы
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((item, i) => (
              <details key={i} className="group border border-gray-200 rounded-lg">
                <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 transition">
                  {item.q}
                  <span className="ml-2 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 text-sm text-[#8B7355] leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
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
            Забронируйте трансфер прямо сейчас — это займёт всего 2 минуты
          </p>
          <Link
            href={user ? "/booking" : "/auth/login"}
            className="inline-block bg-[#E8A838] text-[#1A2332] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#d49a30] transition shadow-lg"
          >
            Забронировать трансфер
          </Link>
        </div>
      </section>
    </div>
  )
}
