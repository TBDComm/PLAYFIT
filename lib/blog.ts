import type { ComponentType } from 'react'

import {
  meta as meta1,
  default as Content1,
} from '@/content/blog/steam-game-recommendation-guide'
import {
  meta as meta2,
  default as Content2,
} from '@/content/blog/best-rpg-games-steam-2026'
import {
  meta as meta3,
  default as Content3,
} from '@/content/blog/steam-playtime-and-taste'
import {
  meta as meta4,
  default as Content4,
} from '@/content/blog/steam-genre-guide-action'
import {
  meta as meta5,
  default as Content5,
} from '@/content/blog/indie-games-hidden-gems'

export interface PostMeta {
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  tags: string[]
}

interface PostEntry {
  meta: PostMeta
  Content: ComponentType
}

const registry: PostEntry[] = [
  { meta: meta1, Content: Content1 },
  { meta: meta2, Content: Content2 },
  { meta: meta3, Content: Content3 },
  { meta: meta4, Content: Content4 },
  { meta: meta5, Content: Content5 },
]

// Sorted newest first
export const allPosts: PostMeta[] = registry
  .map(p => p.meta)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

export function getPost(slug: string): PostEntry | null {
  return registry.find(p => p.meta.slug === slug) ?? null
}

export function getAllSlugs(): string[] {
  return registry.map(p => p.meta.slug)
}
