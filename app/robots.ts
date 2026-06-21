import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://labelforge.app'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/templates', '/login', '/signup'],
        disallow: ['/dashboard', '/editor/', '/history', '/data', '/settings/', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
