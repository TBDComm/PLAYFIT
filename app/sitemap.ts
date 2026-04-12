import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { allPosts } from '@/lib/blog'
import { allArticles } from '@/lib/articles'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://guildeline.com'

function toSlug(genre: string): string {
  return genre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function getTopGameAppids(): Promise<string[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('games_cache')
    .select('appid, tags')
    .not('tags', 'is', null)
    .neq('tags', '{}')
    .limit(5000)

  if (!data) return []

  return (data as { appid: string; tags: Record<string, number> }[])
    .sort((a, b) => Object.keys(b.tags ?? {}).length - Object.keys(a.tags ?? {}).length)
    .map(row => row.appid)
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

  const blogPostRoutes: MetadataRoute.Sitemap = allPosts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const articleRoutes: MetadataRoute.Sitemap = allArticles.map(article => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/genre`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/articles`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    ...blogPostRoutes,
    ...articleRoutes,
  ]

  const [gameAppids, genreSlugs] = await Promise.all([
    getTopGameAppids(),
    getGenreSlugs(),
  ])
  const gameRoutes: MetadataRoute.Sitemap = gameAppids.map(appid => ({
    url: `${baseUrl}/games/${appid}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const genreRoutes: MetadataRoute.Sitemap = genreSlugs.map(slug => ({
    url: `${baseUrl}/genre/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...genreRoutes, ...gameRoutes]
}
