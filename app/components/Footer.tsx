import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-[#1A2332] text-white/60">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} КрымТрансфер</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-white transition">
              Пользовательское соглашение
            </Link>
            <span className="text-white/30">|</span>
            <a href="tel:+79781234567" className="hover:text-[#E8A838] transition">
              +7 (978) 123-45-67
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
