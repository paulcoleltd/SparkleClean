import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url:              BASE,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         1.0,
    },
    {
      url:              `${BASE}/services`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    {
      url:              `${BASE}/booking`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    {
      url:              `${BASE}/contact`,
      lastModified:     new Date(),
      changeFrequency:  'yearly',
      priority:         0.7,
    },
    {
      url:              `${BASE}/about`,
      lastModified:     new Date(),
      changeFrequency:  'yearly',
      priority:         0.6,
    },
    {
      url:              `${BASE}/account/login`,
      lastModified:     new Date(),
      changeFrequency:  'yearly',
      priority:         0.3,
    },
    {
      url:              `${BASE}/account/register`,
      lastModified:     new Date(),
      changeFrequency:  'yearly',
      priority:         0.3,
    },
    {
      url:              `${BASE}/privacy`,
      lastModified:     new Date(),
      changeFrequency:  'yearly',
      priority:         0.2,
    },
    {
      url:              `${BASE}/terms`,
      lastModified:     new Date(),
      changeFrequency:  'yearly',
      priority:         0.2,
    },
  ]
}
