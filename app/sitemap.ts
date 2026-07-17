import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://crimea-transfer.vercel.app', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://crimea-transfer.vercel.app/booking', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://crimea-transfer.vercel.app/terms', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: 'https://crimea-transfer.vercel.app/auth/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://crimea-transfer.vercel.app/driver/register', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]
}
