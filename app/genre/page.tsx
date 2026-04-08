import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Metadata } from 'next'
import Breadcrumb from '@/app/components/Breadcrumb'
import JsonLd from '@/app/components/JsonLd'
import styles from './page.module.css'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://guildeline.com'

export const metadata: Metadata = {
  title: '장르별 탐색 — Guildeline',
  description: 'Steam 게임 장르별 추천 — Guildeline에서 장르를 탐색하고 내 취향에 맞는 게임을 찾아보세요.',
  alternates: { canonical: '/genre' },
}

function toSlug(genre: string): string {
  return genre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function getGenres(): Promise<{ name: string; slug: string; count: number }[]> {
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

  // Deduplicate: slug → first-seen name + count
  const seen = new Map<string, string>()
  const counts = new Map<string, number>()
  for (const row of data) {
    if (Array.isArray(row.genres)) {
      for (const g of row.genres as unknown[]) {
        if (typeof g === 'string' && g.trim()) {
          const slug = toSlug(g.trim())
          if (slug) {
            if (!seen.has(slug)) seen.set(slug, g.trim())
            counts.set(slug, (counts.get(slug) ?? 0) + 1)
          }
        }
      }
    }
  }

  return Array.from(seen.entries())
    .map(([slug, name]) => ({ name, slug, count: counts.get(slug) ?? 0 }))
    .sort((a, b) => b.count - a.count)
}

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

export default async function GenrePage() {
  const genres = await getGenres()
  const featured = genres.slice(0, 12)
  const rest = genres.slice(12)

  const genreJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Steam 게임 장르별 탐색',
        description: 'Guildeline에서 분석한 Steam 게임 장르 목록. 장르별 인기 게임 탐색.',
        url: `${baseUrl}/genre`,
        hasPart: featured.map(g => ({
          '@type': 'WebPage',
          name: `${g.name} 게임 추천`,
          url: `${baseUrl}/genre/${g.slug}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: '장르별 탐색' },
        ],
      },
    ],
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <JsonLd data={genreJsonLd} />
        <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '장르별 탐색' }]} />
        <h1 className={styles.title}>장르별 탐색</h1>
        <p className={styles.stat}>
          Guildeline이 분석한 장르 {genres.length.toLocaleString('en-US')}개 · 총 82,816개 게임
        </p>
        <p className={styles.desc}>관심 있는 장르를 선택해 게임을 탐색해 보세요.</p>

        {genres.length === 0 ? (
          <p className={styles.empty}>장르 데이터를 불러오는 중입니다.</p>
        ) : (
          <>
            {/* Top 12 featured genres */}
            <ul className={styles.featuredGrid} aria-label="인기 게임 장르">
              {featured.map(({ name, slug, count }) => (
                <li key={slug}>
                  <Link href={`/genre/${slug}`} className={styles.featuredCard}>
                    <span className={styles.featuredName}>{name}</span>
                    <span className={styles.featuredCount}>{formatCount(count)}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Remaining genres */}
            {rest.length > 0 && (
              <ul className={styles.grid} aria-label="전체 게임 장르 목록">
                {rest.map(({ name, slug, count }) => (
                  <li key={slug}>
                    <Link href={`/genre/${slug}`} className={styles.genreCard}>
                      {name} <span className={styles.count}>({formatCount(count)})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* ── Recommendation CTA ────────────────────────────────── */}
            <div className={styles.ctaSection}>
              <p className={styles.ctaHeading}>내 취향에 맞는 게임을 추천받아보세요</p>
              <Link href="/#recommend-form" className={styles.ctaLink}>추천 받기 →</Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
