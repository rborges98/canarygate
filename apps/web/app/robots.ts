import type { MetadataRoute } from 'next'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/docs', '/terms', '/privacy'],
      disallow: ['/orgs', '/login', '/verify', '/invite', '/api']
    },
    sitemap: `${appUrl}/sitemap.xml`
  }
}
