"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function Navigation() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Трансфер по Крыму
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-gray-500 hover:text-gray-700 text-sm transition hidden sm:block"
            >
              Оферта
            </Link>
            {session?.user ? (
              <>
                <Link
                  href="/booking"
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  Забронировать
                </Link>
                <Link
                  href="/bookings"
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  Мои бронирования
                </Link>
                {(session.user as any).role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-gray-700 hover:text-blue-600 transition"
                  >
                    Админка
                  </Link>
                )}
                <div className="flex items-center gap-3 ml-4 pl-4 border-l">
                  <span className="text-sm text-gray-500">
                    {(session.user as any).phone}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-sm text-red-600 hover:text-red-800 transition"
                  >
                    Выйти
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
