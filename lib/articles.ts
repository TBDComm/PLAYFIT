import type { ComponentType } from 'react'

import { meta as metaSolo, default as ContentSolo } from '@/content/articles/solo-games'
import { meta as metaCoop, default as ContentCoop } from '@/content/articles/coop-games'
import { meta as metaFree, default as ContentFree } from '@/content/articles/free-steam-games'
import { meta as metaBudget, default as ContentBudget } from '@/content/articles/budget-games'
import { meta as metaIndie, default as ContentIndie } from '@/content/articles/indie-hidden-gems'
import { meta as metaRpg, default as ContentRpg } from '@/content/articles/rpg-guide'
import { meta as metaHorror, default as ContentHorror } from '@/content/articles/horror-games'
import { meta as metaStrategy, default as ContentStrategy } from '@/content/articles/strategy-games'
import { meta as metaRelax, default as ContentRelax } from '@/content/articles/relaxing-games'
import { meta as metaFps, default as ContentFps } from '@/content/articles/fps-guide'
import { meta as metaRogue, default as ContentRogue } from '@/content/articles/roguelike-games'
import { meta as metaOpen, default as ContentOpen } from '@/content/articles/open-world-games'
import { meta as metaSale, default as ContentSale } from '@/content/articles/steam-sale-guide'
import { meta as metaGuide, default as ContentGuide } from '@/content/articles/guildeline-guide'

export interface ArticleMeta {
  slug: string
  title: string
  description: string
  date: string
  tags: string[]
}

interface ArticleEntry {
  meta: ArticleMeta
  Content: ComponentType
}

const registry: ArticleEntry[] = [
  { meta: metaSolo, Content: ContentSolo },
  { meta: metaCoop, Content: ContentCoop },
  { meta: metaFree, Content: ContentFree },
  { meta: metaBudget, Content: ContentBudget },
  { meta: metaIndie, Content: ContentIndie },
  { meta: metaRpg, Content: ContentRpg },
  { meta: metaHorror, Content: ContentHorror },
  { meta: metaStrategy, Content: ContentStrategy },
  { meta: metaRelax, Content: ContentRelax },
  { meta: metaFps, Content: ContentFps },
  { meta: metaRogue, Content: ContentRogue },
  { meta: metaOpen, Content: ContentOpen },
  { meta: metaSale, Content: ContentSale },
  { meta: metaGuide, Content: ContentGuide },
]

// 날짜 내림차순
export const allArticles: ArticleMeta[] = registry
  .map(a => a.meta)
  .sort((a, b) => b.date.localeCompare(a.date))

export function getArticle(slug: string): ArticleEntry | null {
  return registry.find(a => a.meta.slug === slug) ?? null
}

export function getAllArticleSlugs(): string[] {
  return registry.map(a => a.meta.slug)
}
