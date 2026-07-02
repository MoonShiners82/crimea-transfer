"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

function SuccessContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("id") || "XXXXXX"

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Заявка принята!</h1>
        <p className="text-gray-600 mb-6">
          Номер заявки: <span className="font-mono font-bold">№{bookingId}</span>
        </p>

        <div className="bg-blue-50 p-4 rounded mb-6 text-left">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Что дальше?</strong>
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Диспетчер проверит заявку</li>
            <li>✓ Вам придёт SMS с подтверждением</li>
            <li>✓ Сообщение в MAX с данными водителя</li>
            <li>✓ За 2 часа до поездки — напоминание</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/booking"
            className="block w-full bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700"
          >
            Новая заявка
          </Link>
          <Link
            href="/"
            className="block w-full bg-gray-200 text-gray-800 p-3 rounded font-semibold hover:bg-gray-300"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <SuccessContent />
    </Suspense>
  )
}