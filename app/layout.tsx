import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import Navigation from "./components/Navigation"
import Footer from "./components/Footer"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: {
    default: "КрымТрансфер — Трансферы из аэропорта Симферополя | Заказать трансфер по Крыму",
    template: "%s | КрымТрансфер",
  },
  description: "Бронирование комфортного трансфера из аэропорта Симферополя в Ялту, Алушту, Севастополь, Феодосию и другие города Крыма. Фиксированные цены, современные автомобили, опытные водители.",
  keywords: ["трансфер Крым", "трансфер аэропорт Симферополь", "трансфер Ялта", "трансфер Алушта", "трансфер Севастополь", "заказать трансфер", "перевозки Крым"],
  authors: [{ name: "КрымТрансфер" }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "КрымТрансфер",
    title: "КрымТрансфер — Трансферы из аэропорта Симферополя",
    description: "Бронирование комфортного трансфера из аэропорта Симферополя в любой точке Крыма. Фиксированные цены, современные автомобили.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "КрымТрансфер",
              description: "Трансферы из аэропорта Симферополя по всему Крыму",
              url: "https://togocrimea.ru",
              telephone: "+79380961205",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Симферополь",
                addressRegion: "Крым",
                addressCountry: "RU",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 45.0355,
                longitude: 34.1406,
              },
              priceRange: "₽₽₽",
              serviceType: "Трансфер",
              areaServed: {
                "@type": "State",
                name: "Крым",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Providers>
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
