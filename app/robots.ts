import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/dispatcher/', '/driver/', '/api/', '/auth/'] },
    ],
    sitemap: 'https://crimea-transfer.vercel.app/sitemap.xml',
  }
}
