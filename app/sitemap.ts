import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://playfit.pages.dev'

function toSlug(genre: string): string {
  return genre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function getGenreSlugs(): Promise<string[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('games_cache')
    .select('genres')
    .not('genres', 'is', null)
    .limit(5000)

  if (!data) return []

  const genreSet = new Set<string>()
  for (const row of data) {
    if (Array.isArray(row.genres)) {
      for (const g of row.genres) {
        if (typeof g === 'string' && g.trim()) genreSet.add(g.trim())
      }
    }
  }

  return Array.from(genreSet).map(toSlug).filter(Boolean)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ]

  // /games/[appid] deferred until C5

  const genreSlugs = await getGenreSlugs()
  const genreRoutes: MetadataRoute.Sitemap = genreSlugs.map(slug => ({
    url: `${baseUrl}/genre/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...genreRoutes]
}
