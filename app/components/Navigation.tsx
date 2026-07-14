"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function Navigation() {
  const { data: session } = useSession()

  return (
    <nav className="bg-[#1A2332] text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            <span className="text-[#E8A838]">Крым</span>Трансфер
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-white/60 hover:text-white text-sm transition hidden sm:block"
            >
              Оферта
            </Link>
            {session?.user ? (
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
                {session.user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-white/80 hover:text-white transition"
                  >
                    Админка
                  </Link>
                )}
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/20">
                  <span className="text-sm text-white/60">
                    {session.user.phone}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-sm text-[#E8A838] hover:text-[#d49a30] transition"
                  >
                    Выйти
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/auth/signin"
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
