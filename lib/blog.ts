import type { ComponentType } from 'react'

// 블로그 포스트
import { meta as meta1, default as Content1 } from '@/content/blog/steam-game-recommendation-guide'
import { meta as meta2, default as Content2 } from '@/content/blog/best-rpg-games-steam-2026'
import { meta as meta3, default as Content3 } from '@/content/blog/steam-playtime-and-taste'
import { meta as meta4, default as Content4 } from '@/content/blog/steam-genre-guide-action'
import { meta as meta5, default as Content5 } from '@/content/blog/indie-games-hidden-gems'

// 게임 추천 아티클 (블로그로 통합)
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

// 아티클 콘텐츠 파일들이 참조하는 타입 — lib/articles.ts shim에서 재export
export interface ArticleMeta {
  slug: string
  title: string
  description: string
  date: string
  tags: string[]
}

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

// ArticleMeta는 `date` 필드를 사용 — publishedAt으로 정규화
function fromArticle(
  articleMeta: { slug: string; title: string; description: string; date: string; tags: string[] },
  Content: ComponentType
): PostEntry {
  return {
    meta: {
      slug: articleMeta.slug,
      title: articleMeta.title,
      description: articleMeta.description,
      publishedAt: articleMeta.date,
      tags: articleMeta.tags,
    },
    Content,
  }
}

const registry: PostEntry[] = [
  { meta: meta1, Content: Content1 },
  { meta: meta2, Content: Content2 },
  { meta: meta3, Content: Content3 },
  { meta: meta4, Content: Content4 },
  { meta: meta5, Content: Content5 },
  fromArticle(metaSolo, ContentSolo),
  fromArticle(metaCoop, ContentCoop),
  fromArticle(metaFree, ContentFree),
  fromArticle(metaBudget, ContentBudget),
  fromArticle(metaIndie, ContentIndie),
  fromArticle(metaRpg, ContentRpg),
  fromArticle(metaHorror, ContentHorror),
  fromArticle(metaStrategy, ContentStrategy),
  fromArticle(metaRelax, ContentRelax),
  fromArticle(metaFps, ContentFps),
  fromArticle(metaRogue, ContentRogue),
  fromArticle(metaOpen, ContentOpen),
  fromArticle(metaSale, ContentSale),
  fromArticle(metaGuide, ContentGuide),
]

// 날짜 내림차순
export const allPosts: PostMeta[] = registry
  .map(p => p.meta)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

export function getPost(slug: string): PostEntry | null {
  return registry.find(p => p.meta.slug === slug) ?? null
}

export function getAllSlugs(): string[] {
  return registry.map(p => p.meta.slug)
}
