"use client"

import Link from "next/link"
import { useAuth } from "@/lib/useAuth"

export default function Navigation() {
  const { user, signOut } = useAuth()

  return (
    <nav className="bg-[#1A2332] text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            <span className="text-[#E8A838]">Крым</span>Трансфер
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/booking"
                  className="text-white/80 hover:text-white transition"
                >
                  Забронировать
                </Link>
                <Link
                  href="/bookings"
                  className="text-white/80 hover:text-white transition"
                >
                  Мои бронирования
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-white/80 hover:text-white transition"
                  >
                    Админка
                  </Link>
                )}
                {user.role === "dispatcher" && (
                  <Link
                    href="/dispatcher"
                    className="text-white/80 hover:text-white transition"
                  >
                    Диспетчер
                  </Link>
                )}
                {user.role === "driver" && (
                  <Link
                    href="/driver"
                    className="text-white/80 hover:text-white transition"
                  >
                    Водитель
                  </Link>
                )}
                {user.role === "user" && (
                  <Link
                    href="/driver/register"
                    className="text-[#E8A838] hover:text-[#d49a30] transition text-sm"
                  >
                    Стать водителем
                  </Link>
                )}
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/20">
                  <span className="text-sm text-white/60">
                    {user.phone}
                  </span>
                  <button
                    onClick={signOut}
                    className="text-sm text-[#E8A838] hover:text-[#d49a30] transition"
                  >
                    Выйти
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/auth/staff-login"
                className="bg-[#E8A838] text-[#1A2332] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d49a30] transition"
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
