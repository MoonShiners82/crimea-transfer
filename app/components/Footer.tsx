import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Трансфер по Крыму</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-700 transition">
              Пользовательское соглашение
            </Link>
            <span className="text-gray-300">|</span>
            <a href="tel:+79781234567" className="hover:text-gray-700 transition">
              +7 (978) 123-45-67
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
